import { linearFromDecibel } from '../utils.js'
import { waveTables, loadTable } from '../wave_tables/index.js'


export default class Synthetizer extends EventTarget {
	constructor(context) {
		super()

		this.context = context

		this.waves = {}
		this.buffers = {}

		this.playingGraphs = []
	}

	load() {
		const promise = this.loadWaveTables()
		this.createBuffers()
		return promise
	}

	play(params) {
		return new Promise((ok, error) => {
			try {
				const main = this.playSync(params)
				main.addEventListener('ended', () => {
					ok()
				})
			}
			catch(err) {
				error(err)
			}
		})
	}

	playSync(params) {
		const context = this.context
		const t = context.currentTime

		const {
			volume,
			duration,
			attack,
			release,
			startVolume,
			endVolume,
			startFreq,
			endFreq,
			waveType,
			lowPassFreq,
			lowPassQ,
			highPassFreq,
			highPassQ,
		} = params

		const nodes = {}

		const startVol =
			linearFromDecibel(volume) *
			linearFromDecibel(startVolume)
		const endVol =
			linearFromDecibel(volume) *
			linearFromDecibel(endVolume)
		const attackTime = attack * duration
		const releaseTime = release * duration

		nodes.volumeGain = context.createGain(),
		nodes.volumeGain.gain.cancelScheduledValues(t)
		nodes.volumeGain.gain.setValueAtTime(0, t)
		nodes.volumeGain.gain.linearRampToValueAtTime(startVol, t + attackTime)
		nodes.volumeGain.gain.linearRampToValueAtTime(endVol, t + releaseTime)
		nodes.volumeGain.gain.linearRampToValueAtTime(0, t + duration)

		let main = null
		const wave = this.waves[waveType]
		if(wave) {
			nodes.main = context.createOscillator(),
			nodes.main.setPeriodicWave(this.waves[waveType])
			nodes.main.frequency.cancelScheduledValues(t)
			nodes.main.frequency.setValueAtTime(startFreq, t)
			nodes.main.frequency.linearRampToValueAtTime(endFreq, t + duration)
		}
		else {
			nodes.main = context.createBufferSource(),
			nodes.main.buffer = this.buffers[waveType]
			nodes.main.loop = true
		}

		nodes.lowPass = context.createBiquadFilter(),
		nodes.lowPass.type = 'lowpass'
		nodes.lowPass.frequency.value = lowPassFreq
		nodes.lowPass.Q.value = lowPassQ

		nodes.highPass = context.createBiquadFilter(),
		nodes.highPass.type = 'highpass'
		nodes.highPass.frequency.value = highPassFreq
		nodes.highPass.Q.value = highPassQ

		nodes.main
			.connect(nodes.lowPass)
			.connect(nodes.highPass)
			.connect(nodes.volumeGain)
			.connect(context.destination)

		this.playingGraphs.push(nodes)

		nodes.main.start(t)
		nodes.main.stop(t + duration)
		nodes.main.addEventListener('ended', () => this.stop(nodes))

		return nodes.main
	}

	stop(nodes = null) {
		if(nodes === null) {
			const playingGraphs = this.playingGraphs.slice()
			for(const nodes of playingGraphs)
				this.stop(nodes)
			return
		}

		for(const node of Object.values(nodes))
		{
			node.disconnect()
			if(node instanceof AudioScheduledSourceNode)
				node.stop()
		}

		const index = this.playingGraphs.indexOf(nodes)
		if(index < 0)
			throw new Error("Node graph not found")
		this.playingGraphs.splice(index, 1)

		this.dispatchEvent(new Event('ended'))
	}

	loadWaveTables() {
		const createTable = (name, table) => {
			if(table) {
				const real = Float32Array.from(table.real)
				const imag = Float32Array.from(table.imag)
				const wave = this.context.createPeriodicWave(real, imag)
				this.waves[name] = wave
			}
		}

		const promises = []
		for(const [name, table] of Object.entries(waveTables)) {
			if(table === null) {
				promises.push(
					loadTable(name)
						.then((table) => createTable(name, table))
				)
			}
			else {
				createTable(table)
			}
		}

		return Promise.all(promises)
	}

	createBuffers() {
		const sampleRate = this.context.sampleRate

		const white = this.context.createBuffer(1, sampleRate * 2, sampleRate)
		var whiteBuffer = white.getChannelData(0)
		for(let i = 0; i < whiteBuffer.length; ++i)
			whiteBuffer[i] = Math.random() * 2 - 1
		this.buffers.white_noise = white
	}
}

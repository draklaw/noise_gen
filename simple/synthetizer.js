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

	createControl(param, target, duration, options={}) {
		console.log(param)

		const {
			transform = value => value,
		} = options

		if(param === +param) {
			target.value = transform(param)
			return
		}
		target.value = 0

		const context = this.context
		const t = context.currentTime

		const constant = context.createConstantSource()
		constant.start()

		if(param.slope === undefined)
			constant.offset.value = transform(param.value)
		else {
			constant.offset.setValueAtTime(
				transform(param.slope.start), t)
			constant.offset.linearRampToValueAtTime(
				transform(param.slope.end), t + duration)
		}

		let output_node = constant

		if(param.lfo !== undefined) {
			const lfo = context.createOscillator()
			lfo.start()
			lfo.setPeriodicWave(this.waves[param.lfo.type])
			lfo.frequency.value = param.lfo.frequency

			const ampGain = context.createGain()
			ampGain.gain.value = param.lfo.amplitude
			lfo.connect(ampGain)

			const lfoGain = context.createGain()
			ampGain.connect(lfoGain.gain)
			constant.connect(lfoGain)

			lfoGain.connect(target)
		}

		output_node.connect(target)
	}

	playSync(params) {
		const context = this.context
		const t = context.currentTime

		let {
			volume,
			duration,
			attack,
			delay,
			sustain,
			release,
			frequency,
			waveType,
			lowPassFreq,
			lowPassQ,
			highPassFreq,
			highPassQ,
		} = params

		const nodes = {}

		duration = Math.max(duration, attack + delay + release + 0.01)

		nodes.volumePreGain = context.createGain()
		this.createControl(volume, nodes.volumePreGain.gain, duration, {
			transform: linearFromDecibel,
		})

		nodes.volumeGain = context.createGain()
		nodes.volumeGain.gain.cancelScheduledValues(t)
		nodes.volumeGain.gain.setValueAtTime(0, t)
		nodes.volumeGain.gain.linearRampToValueAtTime(
			1, t + attack)
		nodes.volumeGain.gain.linearRampToValueAtTime(
			sustain, t + attack + delay)
		nodes.volumeGain.gain.setValueAtTime(
			sustain, t + duration - release)
		nodes.volumeGain.gain.linearRampToValueAtTime(
			0, t + duration)

		let main = null
		const wave = this.waves[waveType]
		if(wave) {
			nodes.main = context.createOscillator(),
			nodes.main.setPeriodicWave(this.waves[waveType])
			this.createControl(frequency, nodes.main.frequency, duration)
		}
		else {
			nodes.main = context.createBufferSource(),
			nodes.main.buffer = this.buffers[waveType]
			nodes.main.loop = true
		}

		nodes.lowPass = context.createBiquadFilter(),
		nodes.lowPass.type = 'lowpass'
		this.createControl(lowPassFreq, nodes.lowPass.frequency, duration)
		nodes.lowPass.Q.value = lowPassQ

		nodes.highPass = context.createBiquadFilter(),
		nodes.highPass.type = 'highpass'
		this.createControl(highPassFreq, nodes.highPass.frequency, duration)
		nodes.highPass.Q.value = highPassQ

		nodes.main
			.connect(nodes.lowPass)
			.connect(nodes.highPass)
			.connect(nodes.volumePreGain)
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

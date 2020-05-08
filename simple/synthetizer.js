import { linearFromDecibel } from '../utils.js'
import { waveTables, loadTable } from '../wave_tables/index.js'


export default class Synthetizer extends EventTarget {
	constructor(context) {
		super()

		this.context = context

		this.waves = {}
		this.buffers = {}

		this.playingNodes = []
	}

	load() {
		const promise = this.loadWaveTables()
		this.createBuffers()
		return promise
	}

	play(params) {
		return new Promise((ok, error) => {
			try {
				const node = this.playSync(params)
				node.addEventListener('ended', () => {
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

		let {
			volume,
			duration,
			enveloppe,
		} = params

		duration = Math.max(duration,
			enveloppe.attack + enveloppe.delay + enveloppe.release + 0.01)

		const node = new SimpleSynth(this, duration, params)
		node.addEventListener('ended', () => this.stop(node))

		connect(node, context.destination)

		this.playingNodes.push(node)

		return node
	}

	stop(node) {
		const index = this.playingNodes.indexOf(node)
		if(index < 0)
			throw new Error("Node graph not found")
		this.playingNodes.splice(index, 1)

		node.destroy()

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


class Node extends EventTarget {
	constructor(synth, duration) {
		super()

		this.synth = synth
		this.duration = duration

		this.inputs = []
		this.outputs = []
	}

	connect(target, options={}) {
		const {
			outputIndex = 0,
			inputIndex = 0,
		} = options

		if(target instanceof Node) {
			this.outputs[outputIndex].connect(target.inputs[inputIndex])
		}
		else if(target instanceof AudioNode) {
			this.outputs[outputIndex].connect(target, 0, inputIndex)
		}
		else {
			this.outputs[outputIndex].connect(target)
		}
	}

	destroy() {
		for(const node of this.inputs)
			node.disconnect()
		for(const node of this.outputs)
			node.disconnect()
	}
}


class SimpleSynth extends Node {
	constructor(synth, duration, params={}) {
		super(synth, duration)

		this.source = new Source(synth, duration, params.source)
		this.source.addEventListener('ended',
			() => this.dispatchEvent(new Event('ended')))

		let output = this.source

		this.phaser = null
		if(params.phaser !== null) {
			this.phaser = new Phaser(synth, duration, params.phaser)
			output = connect(output, this.phaser)
		}

		this.highPass = null
		if(params.highPass !== null) {
			this.highPass = new BiquadFilter(synth, duration, {
				...params.highPass,
				type: 'highpass',
			})

			output = connect(output, this.highPass)
		}

		this.lowPass = null
		if(params.lowPass !== null) {
			this.lowPass = new BiquadFilter(synth, duration, {
				...params.lowPass,
				type: 'lowpass',
			})

			output = connect(output, this.lowPass)
		}

		this.adsr = new Adsr(synth, duration, params.enveloppe)
		output = connect(output, this.adsr)

		this.volumeControl = new ControlNode(synth, duration, params.volume, {
			transform: linearFromDecibel,
		})

		this.outputVolume = synth.context.createGain()
		this.outputVolume.gain.value = 0
		connect(this.volumeControl, this.outputVolume.gain)
		connect(output, this.outputVolume)

		this.outputs.push(this.outputVolume)
	}

	destroy() {
		this.outputVolume.disconnect()
		this.volumeControl.destroy()
		this.adsr.destroy()
		if(this.lowPass)
			this.lowPass.destroy()
		if(this.highPass)
			this.highPass.destroy()
		if(this.phaser)
			this.phaser.destroy()
		this.source.destroy()
		super.destroy()
	}
}


class Source extends Node {
	constructor(synth, duration, params={}) {
		super(synth, duration)

		const {
			waveType = 'sine',
			frequency = 440,
		} = params

		this.freqControl = null

		const wave = synth.waves[waveType]
		if(wave) {
			this.source = synth.context.createOscillator()
			this.source.setPeriodicWave(synth.waves[waveType])
			this.source.frequency.value = 0

			this.freqControl = new ControlNode(synth, duration, params.frequency)
			connect(this.freqControl, this.source.frequency)
		}
		else {
			this.source = synth.context.createBufferSource()
			this.source.buffer = synth.buffers[waveType]
			this.source.loop = true
		}

		this.inputs.push(this.source)
		this.outputs.push(this.source)

		this.source.start()
		this.source.stop(synth.context.currentTime + duration)

		this.source.addEventListener('ended',
			() => this.dispatchEvent(new Event('ended')))
	}

	destroy() {
		this.inputs[0].stop()
		if(this.freqControl)
			this.freqControl.destroy()
		super.destroy()
	}
}


class Adsr extends Node {
	constructor(synth, duration, params) {
		super(synth, duration)

		const {
			attack = 0.05,
			delay = 0.1,
			sustain = 0.7,
			release = 0.2,
		} = params

		const t = synth.context.currentTime

		this.gain = synth.context.createGain()
		this.gain.gain.cancelScheduledValues(t)
		this.gain.gain.setValueAtTime(0, t)
		this.gain.gain.linearRampToValueAtTime(
			1, t + attack)
		this.gain.gain.linearRampToValueAtTime(
			sustain, t + attack + delay)
		this.gain.gain.setValueAtTime(
			sustain, t + duration - release)
		this.gain.gain.linearRampToValueAtTime(
			0, t + duration)

		this.inputs.push(this.gain)
		this.outputs.push(this.gain)
	}
}


class DryWet extends Node {
	constructor(synth, duration, params) {
		super(synth, duration)

		const {
			dryWet = 0
		} = params

		this.inputs.push(synth.context.createGain())
		this.inputs.push(synth.context.createGain())

		this.outputs.push(synth.context.createGain())

		this.inputs[0].gain.value = 1 - dryWet
		this.inputs[1].gain.value = dryWet

		this.inputs[0].connect(this.outputs[0])
		this.inputs[1].connect(this.outputs[0])
	}
}


class BiquadFilter extends Node {
	constructor(synth, duration, params) {
		super(synth, duration)

		const {
			frequency,
			q,
			type,
		} = params

		this.filter = synth.context.createBiquadFilter()
		this.filter.type = type
		this.filter.frequency.value = 0
		this.filter.Q.value = q

		this.control = new ControlNode(synth, duration, frequency)
		connect(this.control, this.filter.frequency)

		this.inputs.push(this.filter)
		this.outputs.push(this.filter)
	}

	destroy() {
		this.control.destroy()
		super.destroy()
	}
}


class Phaser extends Node {
	constructor(synth, duration, params) {
		super(synth, duration)

		const {
			frequency = 440,
			stages = 4,
			q = 10,
			dryWet = 0.5,
		} = params


		this.dryWet = new DryWet(synth, duration, {
			dryWet: dryWet
		})

		this.inputs.push(synth.context.createGain())
		this.inputs[0].gain.value = 1

		this.outputs.push(this.dryWet.outputs[0])

		this.filters = []

		this.freqControl = new ControlNode(synth, duration, frequency)

		let node = this.inputs[0]
		for(let i = 0; i < stages; ++i) {
			const filter = synth.context.createBiquadFilter()
			filter.type = 'allpass'
			filter.frequency.value = 0
			connect(this.freqControl, filter.frequency)
			filter.Q.value = q

			this.filters.push(filter)
			node = node.connect(filter)
		}

		connect(this.inputs[0], this.dryWet, { inputIndex: 0 })

		connect(this.inputs[0], this.filters[0])
		connect(node, this.dryWet, { inputIndex: 1 })
	}

	destroy() {
		super.destroy()

		this.dryWet.destroy()
		this.freqControl.destroy()
		for(const node of this.filters)
			node.disconnect()
	}
}


class ControlNode extends Node {
	constructor(synth, duration, params, options={}) {
		super(synth, duration)

		if(params === +params)
			params = { value: params }

		const {
			transform = value => value,
		} = options

		const t = synth.context.currentTime

		this.value = synth.context.createConstantSource()
		this.value.offset.value = 0
		this.value.start()

		if(params.slope === undefined)
			this.value.offset.value = transform(params.value)
		else {
			this.value.offset.setValueAtTime(
				transform(params.slope.start), t)
			this.value.offset.linearRampToValueAtTime(
				transform(params.slope.end), t + duration)
		}

		this.outputs.push(this.value)

		this.lfo = null
		this.ampGain = null
		this.lfoGain = null
		if(params.lfo !== undefined) {
			this.lfo = synth.context.createOscillator()
			this.lfo.type = params.lfo.type
			this.lfo.frequency.value = params.lfo.frequency
			this.lfo.start()

			// This is a * lfo
			this.ampGain = synth.context.createGain()
			this.ampGain.gain.value = params.lfo.amplitude
			connect(this.lfo, this.ampGain)

			// So this is v * (1 + a * lfo)
			this.lfoGain = synth.context.createGain()
			this.lfoGain.gain.value = 1
			connect(this.ampGain, this.lfoGain.gain)
			this.outputs[0] = connect(this.outputs[0], this.lfoGain)
		}
	}

	destroy() {
		this.value.stop()
		if(this.lfo) {
			this.lfo.stop()
			this.lfoGain.disconnect()
			this.ampGain.disconnect()
			this.lfo.disconnect()
		}
		this.value.disconnect()
		super.destroy()
	}
}


function connect(source, target, options={}) {
	if(source instanceof Node) {
		source.connect(target, options)
	}
	else if(target instanceof Node) {
		const {
			outputIndex = 0,
			inputIndex = 0,
		} = options
		source.connect(target.inputs[inputIndex], outputIndex)
	}
	else {
		const {
			outputIndex = 0,
			inputIndex = 0,
		} = options
		if(target instanceof AudioNode)
			source.connect(target, outputIndex, inputIndex)
		else
			source.connect(target)
	}

	return target
}

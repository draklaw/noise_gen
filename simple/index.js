import { clamp, el } from '../utils.js'
import ParamSet from './param_set.js'
import Synthetizer from './synthetizer.js'
import InputPanel, { Section } from './input_panel.js'
import ValueWidget from './value_widget.js'


export default class SimpleNG {
	constructor() {
		this.paramSet = new ParamSet()
		this.params = this.paramSet.createParameters()
		window.params = this.params

		this.phaser = this.params.phaser
		this.lowPass = this.params.lowPass
		this.highPass = this.params.highPass

		this.context = new AudioContext()
		this.synthetizer = new Synthetizer(this.context)
		this.synthetizer.load()

		this.sliders = {}
		this.selects = {}
		this.elem = null
		this.downloadLink = null
		this.nameField = null

		this.context.suspend()
		this.synthetizer.addEventListener('ended', () => {
			if(this.synthetizer.playingNodes.length === 0)
				this.context.suspend()
		})

		this.setupGui()
	}

	play() {
		params = { ...this.params }

		if(!this.phaserSection.value)
			params.phaser = null
		if(!this.lowPassSection.value)
			params.lowPass = null
		if(!this.highPassSection.value)
			params.highPass = null

		console.log("Play", params)
		this.synthetizer.play(params)
		this.context.resume()
	}

	saveParams() {
		const json = JSON.stringify(this.params, null, 4)
		const blob = new Blob([json], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		this.downloadLink.href = url
		this.downloadLink.download = `${this.nameField.value}.json`
		this.downloadLink.click()
		URL.revokeObjectURL(url)
	}

	async saveSound() {
		const context = new OfflineAudioContext(
			1,
			this.params.duration * this.context.sampleRate,
			this.context.sampleRate,
		)

		const synth = new Synthetizer(context)
		await synth.load()
		synth.play(this.params)

		const audioBuffer = await context.startRendering()
		const channel = audioBuffer.getChannelData(0)

		const buffer = new ArrayBuffer(44 + channel.length * 4)
		const view = new DataView(buffer)

		// Hand-made .wav saver. Yay !
		view.setUint32(0, 0x52494646)	// 'RIFF'
		view.setUint32(4, 36 + channel.length * 4, true) // Total size (-8 for the 2 first fields)
		view.setUint32(8, 0x57415645)	// 'WAVE'

		view.setUint32(12, 0x666d7420)	// 'fmt '
		view.setUint32(16, 16, true)	// Chunk size
		view.setUint16(20, 1, true)		// Format (1 = linear)
		view.setUint16(22, 1, true)		// # channels
		view.setUint32(24, context.sampleRate, true)	// Sample rate
		view.setUint32(28, 4 * context.sampleRate, true)	// Byte rate
		view.setUint16(32, 4, true)		// BlockAlign (bytes per sample * # channels)
		view.setUint16(34, 32, true)	// Bits per sample

		view.setUint32(36, 0x64617461)	// 'data'
		view.setUint32(40, 4 * channel.length, true) // Chunk size

		// Data !
		for(let i = 0; i < channel.length; ++i) {
			const int = channel[i] * 0x80000000
			const clamped = clamp(int, -0x80000000, 0x7fffffff)
			view.setInt32(44 + i * 4, clamped, true)
		}

		const blob = new Blob([buffer], { type: 'audio/wav' })
		const url = URL.createObjectURL(blob)
		this.downloadLink.href = url
		this.downloadLink.download = `${this.nameField.value}.wav`
		this.downloadLink.click()
		URL.revokeObjectURL(url)
	}

	setupGui() {
		this.downloadLink = el('a', { 'style': 'display: none;' })
		this.nameField = el('input', {
			'class': 'nameField',
			'type': 'text',
			'value': 'noise',
		})

		const makeParams = (...path) => [
			path.join('.'),
			this.params.get(path),
			this.paramSet.get(path),
			value => this.params.set(path, value),
		]

		this.generalSection = new Section('General', {},
			new InputPanel()
				.addRow('volume', new ValueWidget(...makeParams('volume')))
				.addSlider(...makeParams('duration'))
		)

		this.enveloppeSection = new Section('Enveloppe', {},
			new InputPanel()
				.addSlider(...makeParams('enveloppe', 'attack'))
				.addSlider(...makeParams('enveloppe', 'delay'))
				.addSlider(...makeParams('enveloppe', 'sustain'))
				.addSlider(...makeParams('enveloppe', 'release'))
		)

		this.sourceSection = new Section('Source', {},
			new InputPanel()
				.addSelect(...makeParams('source', 'waveType'))
				.addRow('frequency', new ValueWidget(...makeParams('source', 'frequency')))
		)

		this.phaserSection = new Section('Phaser', { checkable: true },
			new InputPanel()
				.addRow('frequency', new ValueWidget(...makeParams('phaser', 'frequency')))
				.addSlider(...makeParams('phaser', 'stages'))
				.addSlider(...makeParams('phaser', 'q'))
				.addSlider(...makeParams('phaser', 'dryWet'))
		)

		this.highPassSection = new Section('High pass', { checkable: true },
			new InputPanel()
				.addRow('frequency', new ValueWidget(...makeParams('highPass', 'frequency')))
				.addSlider(...makeParams('highPass', 'q'))
		)

		this.lowPassSection = new Section('Low pass', { checkable: true },
			new InputPanel()
				.addRow('frequency', new ValueWidget(...makeParams('lowPass', 'frequency')))
				.addSlider(...makeParams('lowPass', 'q'))
		)

		this.elem = el('div', { 'class': 'simpleNG' },
			this.downloadLink,
			this.createButton('Play', () => this.play(this.context)),
			this.nameField,
			this.createButton('Save params', this.saveParams.bind(this)),
			this.createButton('Save sound', this.saveSound.bind(this)),
			this.generalSection.render(),
			this.enveloppeSection.render(),
			this.sourceSection.render(),
			this.phaserSection.render(),
			this.lowPassSection.render(),
			this.highPassSection.render(),
		)

		return this.elem
	}

	createSection(title, ...children) {
		return el('div', { 'class': 'section' },
			el('h2', { 'class': 'sectionTitle' }, title),
			...children
		)
	}

	createButton(label, callback) {
		const button = el('button', { 'type': 'button' },
			label
		)
		button.addEventListener('click', callback)
		return button
	}
}

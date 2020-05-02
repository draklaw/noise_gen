import { clamp, el } from '../utils.js'
import Slider from './slider.js'
import ParamSet from './param_set.js'
import Synthetizer from './synthetizer.js'


export default class SimpleNG {
	constructor() {
		this.paramSet = new ParamSet()
		this.params = this.paramSet.createParameters()

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
			if(this.synthetizer.playingGraphs.length === 0)
				this.context.suspend()
		})

		this.setupGui()
	}

	play() {
		this.synthetizer.play(this.params)
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
			const clamped = clamp(channel[i], -1, 1)
			const int = clamped * 0x80000000
			view.setInt32(44 + i * 4, int, true)
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

		this.elem = el('div', { 'class': 'simpleNG' },
			this.downloadLink,
			this.createButton('Play', () => this.play(this.context)),
			this.nameField,
			this.createButton('Save params', this.saveParams.bind(this)),
			this.createButton('Save sound', this.saveSound.bind(this)),
			this.createSection('General',
				this.createSlider('volume'),
				this.createSlider('duration'),
			),
			this.createSection('Enveloppe',
				this.createSlider('attack'),
				this.createSlider('release'),
				this.createSlider('startVolume'),
				this.createSlider('endVolume'),
			),
			this.createSection('Main oscillator',
				this.createComboBox('waveType'),
				this.createSlider('startFreq'),
				this.createSlider('endFreq',),
			),
			this.createSection('Filters',
				this.createSlider('lowPassFreq'),
				this.createSlider('lowPassQ'),
				this.createSlider('highPassFreq'),
				this.createSlider('highPassQ'),
			),
		)

		return this.elem
	}

	createSection(title, ...children) {
		return el('div', { 'class': 'section' },
			el('h2', { 'class': 'sectionTitle' }, title),
			...children
		)
	}

	createField(label, widget) {
		return el('div', { 'class': 'field' },
			el('div', { 'class': 'fieldLabel' }, label),
			widget,
		)
	}

	// createControllableField(param, label)

	createSlider(param) {
		const value = this.params[param]
		const { label, min, max, scale, decimals } = this.paramSet[param]

		const slider = new Slider(value, min, max, scale, decimals)
		slider.addEventListener('valueChanged',
			() => { this.params[param] = slider.value() }
		)

		this.sliders[param] = slider

		return this.createField(label, slider.element())
	}

	createComboBox(param) {
		const value = this.params[param]
		const { label, choices } = this.paramSet[param]

		const comboBox = el('select', { 'class': 'comboBox' })
		for(const choice of choices) {
			comboBox.appendChild(el('option', {
				'value': choice,
				'enabled': (choice === value)? true: undefined
			},
				choice,
			))
		}
		comboBox.addEventListener('input',
			() => { this.params[param] = comboBox.value }
		)

		this.selects[param] = comboBox

		return this.createField(label, comboBox)
	}

	createButton(label, callback) {
		const button = el('button', { 'type': 'button' },
			label
		)
		button.addEventListener('click', callback)
		return button
	}
}

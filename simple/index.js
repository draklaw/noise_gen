import { el, linearFromDecibel } from '../utils.js'
import { waveTables, loadTable } from '../wave_tables/index.js'
import Slider from './slider.js'
import ParamSet from './param_set.js'


export default class SimpleNG {
	constructor() {
		this.paramSet = new ParamSet()
		this.params = this.paramSet.createParameters()

		this.playCounter = 0
		this.context = new AudioContext()
		this.waves = {}
		this.buffers = {}

		this.sliders = {}
		this.selects = {}
		this.elem = null
		this.downloadLink = null

		this.context.suspend()

		this.loadWaveTables()
		this.createBuffers()
		this.setupGui()
	}

	play(context) {
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
		} = this.params

		const startVol =
			linearFromDecibel(volume) *
			linearFromDecibel(startVolume)
		const endVol =
			linearFromDecibel(volume) *
			linearFromDecibel(endVolume)
		const attackTime = attack * duration
		const releaseTime = release * duration

		const volumeGain = context.createGain()
		volumeGain.gain.cancelScheduledValues(t)
		volumeGain.gain.setValueAtTime(0, t)
		volumeGain.gain.linearRampToValueAtTime(startVol, t + attackTime)
		volumeGain.gain.linearRampToValueAtTime(endVol, t + releaseTime)
		volumeGain.gain.linearRampToValueAtTime(0, t + duration)

		let main = null
		const wave = this.waves[waveType]
		if(wave) {
			const osc = context.createOscillator()
			osc.setPeriodicWave(this.waves[waveType])
			osc.frequency.setValueAtTime(startFreq, t)
			osc.frequency.linearRampToValueAtTime(endFreq, t + duration)
			main = osc
		}
		else {
			const source = context.createBufferSource()
			source.buffer = this.buffers[waveType]
			source.loop = true

			main = source
		}

		const lowPass = context.createBiquadFilter()
		lowPass.type = 'lowpass'
		lowPass.frequency.value = lowPassFreq
		lowPass.Q.value = lowPassQ

		const highPass = context.createBiquadFilter()
		highPass.type = 'highpass'
		highPass.frequency.value = highPassFreq
		highPass.Q.value = highPassQ

		main.connect(lowPass)
			.connect(highPass)
			.connect(volumeGain)
			.connect(context.destination)

		main.start(t)
		main.stop(t + duration)
		main.addEventListener('ended', () => {
			this.playCounter -= 1
			if(this.playCounter == 0) {
				console.log("Done playing")
				this.context.suspend()
			}
		})

		if(this.playCounter == 0) {
			console.log("Start playing...")
			context.resume()
		}
		this.playCounter += 1
	}

	saveParams() {
		const json = JSON.stringify(this.params, null, 4)
		const blob = new Blob([json], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		this.downloadLink.href = url
		this.downloadLink.download = 'noise_param.json'
		this.downloadLink.click()
		URL.revokeObjectURL(url)
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

		for(const [name, table] of Object.entries(waveTables)) {
			if(table === null) {
				loadTable(name).then((table) => createTable(name, table))
			}
			else {
				createTable(table)
			}
		}
	}

	createBuffers() {
		const sampleRate = this.context.sampleRate

		const white = this.context.createBuffer(1, sampleRate * 2, sampleRate)
		var whiteBuffer = white.getChannelData(0)
		for(let i = 0; i < whiteBuffer.length; ++i)
			whiteBuffer[i] = Math.random() * 2 - 1
		this.buffers.white_noise = white
	}

	setupGui() {
		this.downloadLink = el('a', { 'style': 'display: none;' })
		this.elem = el('div', { 'class': 'simpleNG' },
			this.downloadLink,
			this.createButton('Play', () => this.play(this.context)),
			this.createButton('Save params', this.saveParams.bind(this)),
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

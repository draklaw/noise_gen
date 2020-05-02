// import { el } from './utils.js'
// import Slider from './simple/slider.js'
// import ParamSet from './simple/param_set.js'
import SimpleNG from './simple/index.js'

// let paramSet = new ParamSet()
// window.paramSet = paramSet
//
// const context = new AudioContext()
// context.suspend()

// let playCounter = 0


// function play(context) {
// 	const t = context.currentTime
//
// 	const startVolume =
// 		linearFromDecibel(paramSet.volume) *
// 		linearFromDecibel(paramSet.startVolume)
// 	const endVolume =
// 		linearFromDecibel(paramSet.volume) *
// 		linearFromDecibel(paramSet.endVolume)
// 	const attackTime = paramSet.attack * paramSet.duration
// 	const releaseTime = paramSet.release * paramSet.duration
//
// 	const volumeGain = context.createGain()
// 	volumeGain.gain.cancelScheduledValues(t)
// 	volumeGain.gain.setValueAtTime(0, t)
// 	volumeGain.gain.linearRampToValueAtTime(startVolume, t + attackTime)
// 	volumeGain.gain.linearRampToValueAtTime(endVolume, t + releaseTime)
// 	volumeGain.gain.linearRampToValueAtTime(0, t + paramSet.duration)
//
// 	const osc = context.createOscillator()
// 	osc.type = paramSet.waveType
// 	osc.frequency.setValueAtTime(paramSet.startFreq, t)
// 	osc.frequency.linearRampToValueAtTime(paramSet.endFreq, t + paramSet.duration)
// 	osc.addEventListener('ended', () => {
// 		playCounter -= 1
// 		if(playCounter == 0)
// 			context.suspend()
// 	})
//
// 	osc.connect(volumeGain).connect(context.destination)
//
// 	osc.start(context.currentTime)
// 	osc.stop(context.currentTime + paramSet.duration)
//
// 	playCounter += 1
// 	context.resume()
// }


const mainPanel = document.getElementById('mainPanel')

const simpleNg = new SimpleNG()
mainPanel.appendChild(simpleNg.elem)
// const sliders = {}


// function addField(label, widget) {
// 	const field = el('div', { 'class': 'field' },
// 		el('div', {
// 			'class': 'fieldLabel',
// 		},
// 			label,
// 		),
// 		widget,
// 	)
//
// 	mainPanel.appendChild(field)
//
// 	return field
// }
//
//
// function addSection(title) {
// 	const sect = el('h2', { 'class': 'sectionTitle' }, title)
// 	mainPanel.appendChild(sect)
// }
//
// function addSlider(param, label, min, max, scale, decimals) {
// 	const value = paramSet[param]
// 	const slider = new Slider(value, min, max, scale, decimals)
// 	slider.addEventListener('valueChanged',
// 		() => { paramSet[param] = slider.value() }
// 	)
//
// 	const field = addField(label, slider.element())
//
// 	sliders[param] = slider
// }
//
// function addComboBox(param, label, choices) {
// 	const value = paramSet[param]
// 	const comboBox = el('select', { 'class': 'comboBox' })
// 	for(const choice of choices) {
// 		comboBox.appendChild(el('option', {
// 			'value': choice,
// 			'enabled': (choice === value)? true: undefined
// 		},
// 			choice
// 		))
// 	}
// 	comboBox.addEventListener('input',
// 		() => { paramSet[param] = comboBox.value }
// 	)
//
// 	const field = addField(label, comboBox)
// }
//
// const playButton = el('button', {
// 	'class': 'playButton',
// 	'type': 'button',
// },
// 	"Play"
// )
// playButton.addEventListener('click', () => play(context))
// mainPanel.appendChild(playButton)
//
// addSection('General')
// addSlider('volume', 'Volume (dB):', -80, 0, 'linear', 2)
// addSlider('duration', 'Duration (s):', 0.01, 100, 'logarithmic', 3)
//
// addSection('Enveloppe')
// addSlider('attack', 'Attack:', 0, 1, 'linear', 3)
// addSlider('release', 'Release:', 0, 1, 'linear', 3)
// addSlider('startVolume', 'Start volume (dB):', -80, 0, 'linear', 2)
// addSlider('endVolume', 'End volume (dB):', -80, 0, 'linear', 2)
//
// addSection('Main oscillator')
// addComboBox('waveType', 'Wave type:', ['sine', 'square', 'sawtooth', 'triangle'])
// addSlider('startFreq', 'Start frequency (Hz):', 27.5, 7040, 'logarithmic', 2)
// addSlider('endFreq', 'End frequency (Hz):', 27.5, 7040, 'logarithmic', 2)


// function linearFromDecibel(decibel) {
// 	return Math.pow(10, decibel / 20)
// }

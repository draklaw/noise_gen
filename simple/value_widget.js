import { el } from '../utils.js'
import { Input } from './component.js'
import InputPanel from './input_panel.js'
import { Toolbar } from './toolbar.js'


export default class ValueWidget extends Input {
	constructor(name, value, param, callback) {
		super(value)

		this._param = param
		this._callback = callback

		this._hasOptions = param.options.length !== 0
		this._hasSlope = param.options.indexOf('slope') >= 0
		this._hasLfo = param.options.indexOf('lfo') >= 0

		this._showSlope = false
		this._showLfo = false

		this._panel = null
		this.slopePanel = null
		this.lfoPanel = null
	}

	get showSlope() {
		return this._showSlope
	}

	set showSlope(value) {
		if(value === this._showSlope)
			return

		this._showSlope = value

		this.value = this._buildValue()
	}

	get showLfo() {
		return this._showLfo
	}

	set showLfo(value) {
		if(value === this._showLfo)
			return

		this._showLfo = value

		this.value = this._buildValue()
	}

	_buildValue() {
		if(!this._showSlope && !this._showLfo)
			return this._panel.value.input.value

		const value = {
			'value': this._panel.value.input.value
		}

		if(this._showSlope) {
			value.slope = {
				'start': this._slopePanel.start.input.value,
				'end': this._slopePanel.end.input.value,
			}
		}

		if(this._showLfo) {
			value.lfo = {
				'type': this._lfoPanel.type.input.value,
				'amplitude': this._lfoPanel.amplitude.input.value,
				'frequency': this._lfoPanel.frequency.input.value,
			}
		}

		return value
	}

	updateValue(value) {
		this._value = value

		const isSimple = value === +value

		this._panel.value.visible = isSimple || (value.slope === undefined)

		this._slopePanel.visible = !isSimple && (value.slope !== undefined)
		this._lfoPanel.visible = !isSimple && (value.lfo !== undefined)
	}

	initialRender() {
		const update = () => this.value = this._buildValue()

		this._panel = new InputPanel()
			.addInput(
				'toolbar',
				this._param.label,
				new Toolbar()
					.addButton('slope', 'Slope', {
						'callback': value => this.showSlope = value,
					})
					.addButton('lfo', 'LFO', {
						'callback': value => this.showLfo = value,
					})
			)
			.addSlider('value', this._value, {
				...this._param,
				label: 'Value'
			}, update)

		if(this._hasSlope) {
			this._slopePanel = new InputPanel()
				.addSlider('start', this._value, {
					...this._param,
					label: 'Start value:',
				}, update)
				.addSlider('end', this._value, {
					...this._param,
					label: 'End value:',
				}, update)
			this._panel.addRow('slope', this._slopePanel)
		}

		if(this._hasLfo) {
			this._lfoPanel = new InputPanel()
				.addSelect('type', 'sine', {
					label: 'LFO type:',
					choices: ['sine', 'saw', 'triangle', 'square'],
				}, update)
				.addSlider('amplitude', 1, {
					label: 'LFO amplitude:',
					min: 0.01,
					max: 10,
					scale: 'logarithmic',
					decimals: 2,
				}, update)
				.addSlider('frequency', 10, {
					label: 'LFO freq.:',
					min: 0.1,
					max: 1000,
					scale: 'logarithmic',
					decimals: 2,
				}, update)
			this._panel.addRow('lfo', this._lfoPanel)
		}

		const elem = this._panel.render()

		this.updateValue(this._value)
		if(this._callback)
			this.addEventListener('valueChanged', event => this._callback(event.value))

		return elem
	}
}

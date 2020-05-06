import { clamp, el } from '../utils.js'
import { Input } from './component.js'


export default class Slider extends Input {
	constructor(value, min=0, max=1, scale='linear', decimals=2) {
		super(value)

		this._min = min
		this._max = max
		this._scale = scale
		this._decimals = decimals

		this._numberElem = null
		this._rangeElem = null
		this._elem = null
	}

	updateValue(value) {
		this._value = clamp(+value, this._min, this._max)
		this._numberElem.value = this._value.toFixed(this._decimals)
		this._rangeElem.value = this._sliderFromValue(this._value)
	}

	initialRender() {
		this._numberElem = el('input', {
			'class': 'sliderNumber',
			'type': 'number',
			'min': `${this._min}`,
			'max': `${this._max}`,
			'step': 'any',
		})
		this._numberElem.addEventListener('input',
			this._numberValueChanged.bind(this))

		this._rangeElem = el('input', {
			'class': 'sliderRange',
			'type': 'range',
			'min': `${this._min}`,
			'max': `${this._max}`,
			'step': 'any',
		})
		this._rangeElem.addEventListener('input',
			this._rangeValueChanged.bind(this))

		this.updateValue(this._value)

		return el('div', { 'class': 'slider fieldWidget' },
			this._numberElem,
			this._rangeElem,
		)
	}

	_numberValueChanged(event) {
		this.value = this._numberElem.value
	}

	_rangeValueChanged(value) {
		this.value = this._valueFromSlider(this._rangeElem.value)
	}

	_sliderFromValue(value) {
		if(this._scale === 'linear')
			return +value
		if(this._scale === 'logarithmic') {
			const lvalue = Math.log(+value)
			const lmin = Math.log(this._min)
			const lmax = Math.log(this._max)
			const scale = (this._max - this._min) / (lmax - lmin)
			const slider = (lvalue - lmin) * scale + this._min
			return slider
		}
		throw new Error("Invalid scale")
	}

	_valueFromSlider(sliderValue) {
		if(this._scale === 'linear')
			return +sliderValue
		if(this._scale === 'logarithmic') {
			const lmin = Math.log(this._min)
			const lmax = Math.log(this._max)
			const scale = (lmax - lmin) / (this._max - this._min)
			const lvalue = (+sliderValue - this._min) * scale + lmin
			const value = Math.exp(lvalue)
			return value
		}
		throw new Error("Invalid scale")
	}
}

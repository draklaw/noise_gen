import { clamp, el } from '../utils.js';


export default class Slider extends EventTarget {
	constructor(value, min=0, max=0, scale='linear', decimals=2) {
		super()

		this._value = NaN
		this._min = min
		this._max = max
		this._scale = scale
		this._decimals = decimals

		this._numberElem = el('input', {
			'class': 'sliderNumber',
			'type': 'number',
			'min': `${this._min}`,
			'max': `${this._max}`,
			'step': 'any',
		})

		this._rangeElem = el('input', {
			'class': 'sliderRange',
			'type': 'range',
			'min': `${this._min}`,
			'max': `${this._max}`,
			'step': 'any',
		})

		this._elem = el('div', { 'class': 'slider fieldWidget' },
			this._numberElem,
			this._rangeElem,
		)

		this._numberElem.addEventListener('input',
			this._numberValueChanged.bind(this))
		this._rangeElem.addEventListener('input',
			this._rangeValueChanged.bind(this))

		this.setValue(value)
	}

	value() {
		return this._value
	}

	setValue(value) {
		value = clamp(value, this._min, this._max, value)
		if(value != this._value) {
			this._value = value
			this._numberElem.value = this._value.toFixed(this._decimals)
			this._rangeElem.value = this._sliderFromValue(this._value)
			this.dispatchEvent(new Event('valueChanged'))
		}
	}

	element() {
		return this._elem
	}

	_numberValueChanged(event) {
		this.setValue(this._numberElem.value)
	}

	_rangeValueChanged(value) {
		this.setValue(this._valueFromSlider(this._rangeElem.value))
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

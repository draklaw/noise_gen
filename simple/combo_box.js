import { el } from '../utils.js'
import { Input } from './component.js'


export default class ComboBox extends Input {
	constructor(value, choices) {
		super(value)

		this._choices = choices
	}

	updateValue(value) {
		this._value = value
		this._elem.value = this._value
	}

	initialRender() {
		const elem = el('select', { 'class': 'comboBox' })

		for(const choice of this._choices) {
			elem.appendChild(
				el('option', { 'value': choice },
					choice,
				)
			)
		}
		elem.value = this.value

		elem.addEventListener('input', () => this.value = elem.value)

		return elem
	}
}

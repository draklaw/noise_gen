import { el } from '../utils.js'
import Component from './component.js'
import Slider from './slider.js'
import ComboBox from './combo_box.js'


export class LabelInput extends Component {
	constructor(label, input) {
		super()

		this._label = label
		this._input = input
	}

	get label() {
		return this._label
	}

	get input() {
		return this._input
	}

	initialRender() {
		return el('div', { 'class': 'field' },
			el('div', { 'class': 'fieldLabel' }, this.label),
			this.input.render(),
		)
	}
}


export default class InputPanel extends Component {
	constructor(label = null) {
		super()

		this._rows = []
	}

	addRow(name, row) {
		this[name] = row
		this._rows.push(row)

		return this
	}

	addInput(name, label, input) {
		const li = new LabelInput(label, input)
		this.addRow(name, li)

		return this
	}

	addSlider(name, value, param, callback=null) {
		const { label, min, max, scale, decimals, options } = param

		const slider = new Slider(value, min, max, scale, decimals)

		if(callback)
			slider.addEventListener('valueChanged', event => callback(event.value))

		this.addInput(name, label, slider)

		return this
	}

	addSelect(name, value, param, callback=null) {
		const { label, choices } = param

		const comboBox = new ComboBox(value, choices)

		if(callback)
			comboBox.addEventListener('valueChanged', event => callback(event.value))

		this.addInput(name, label, comboBox)

		return this
	}

	initialRender() {
		const elem = el('div', { 'class': 'controlGroup' })

		for(const row of this._rows)
			elem.appendChild(row.render())

		return elem
	}
}

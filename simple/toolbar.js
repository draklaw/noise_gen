import { el } from '../utils.js'
import Component, { Input } from './component.js'


export class Button extends Input {
	constructor(label, options={}) {
		super(false)

		const {
			checkable = false,
		} = options

		this._label = label
		this._checkable = checkable
		this._class = options['class'] || ''
	}

	get label() {
		return this._label
	}

	updateValue(value) {
		this._value = value
		if(this._value)
			this._elem.classList.add('checked')
		else
			this._elem.classList.remove('checked')
	}

	initialRender() {
		const button = el('button', { 'class': `button ${this._class}` },
			this._label,
		)

		button.addEventListener('click', this._clickEvent.bind(this))

		return button
	}

	_clickEvent() {
		this.dispatchEvent(new Event('click'))
		if(this._checkable)
			this.value = !this.value
	}
}


export class Toolbar extends Component {
	constructor() {
		super()

		this._children = []
	}

	addChild(name, child) {
		this[name] = child
		this._children.push(child)
	}

	addButton(name, label, options={}) {
		const {
			checkable = true,
			callback = null,
		} = options

		const button = new Button(label, { 'checkable': checkable })

		if(callback) {
			if(checkable) {
				button.addEventListener('valueChanged',
					event => callback(event.value)
				)
			}
			else
			{
				button.addEventListener('click', callback)
			}
		}

		this.addChild(name, button)

		return this
	}

	initialRender() {
		const elem = el('div', { 'class': 'toolbar' })

		for(const child of this._children)
			elem.appendChild(child.render())

		return elem
	}
}

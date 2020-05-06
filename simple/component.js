export class ValueChangedEvent extends Event {
	constructor(value) {
		super('valueChanged')
		this.value = value
	}
}


export default class Component extends EventTarget {
	constructor() {
		super()
		this._elem = null
	}

	get visible() {
		return !this._elem.hidden
	}

	set visible(visible) {
		if(visible)
			this._elem.style.removeProperty('display')
		else
			this._elem.style.display = 'none'
	}

	render() {
		if(this._elem === null) {
			this._elem = this.initialRender()
		}
		return this._elem
	}
}


export class Input extends Component {
	constructor(value) {
		super()
		this._value = value
	}

	get value() {
		return this._value
	}

	set value(value) {
		if(value != this._value) {
			this.updateValue(value)
			this.dispatchEvent(new ValueChangedEvent(this._value))
		}
	}

	updateValue(value) {
		this._value = value
	}
}

import { el } from "./utils.js"


export class NodeType {
	constructor(name, inputs, outputs, params) {
		this.name = name
		this.inputs = inputs
		this.outputs = outputs
		this.params = params
	}
}


export class Node {
	constructor(nodeType) {
		this.nodeType = nodeType
		this.params = {}
		this.x = 100
		this.y = 100
	}


	render() {
		const {
			name,
			inputs,
			outputs,
			params,
		} = this.nodeType

		const node = el("div", { "class": "node" },
			el("div", { "class": "nodeBlock nodeName" }, name)
		)
		node.style.left = `${this.x}px`
		node.style.top = `${this.y}px`

		for(const input of inputs) {
			node.appendChild(
				el("div", { "class": "nodeBlock nodeInput" }, input)
			)
		}

		for(const output of outputs) {
			node.appendChild(
				el("div", { "class": "nodeBlock nodeOutput" }, output)
			)
		}

		for(const param of params) {
			node.appendChild(
				el("div", { "class": "nodeBlock nodeParam" }, param)
			)
		}

		return node
	}
}

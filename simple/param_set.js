import { waveTables } from '../wave_tables/index.js'


function valueParam(value, label, min, max, scale, decimals, options=[]) {
	return {
		type: 'value',
		label: label,
		default: value,
		min: min,
		max: max,
		scale: scale,
		decimals: decimals,
		options: options,
	}
}

function choiceParam(value, label, choices) {
	return {
		type: 'choice',
		label: label,
		default: value,
		choices: choices,
	}
}


export default class ParamSet {
	constructor() {
		this.volume = valueParam(
			-20,
			'Volume (dB):', -80, 0, 'linear', 2,
			['slope', 'lfo'],
		)
		this.duration = valueParam(
			1,
			'Duration (s):', 0.01, 100, 'logarithmic', 3,
		)

		this.source = {
			waveType: choiceParam(
				'sine', 'Wave type:',
				Array.from(Object.keys(waveTables))
					.concat(['white_noise']),
			),
			frequency: valueParam(
				440,
				'Frequency (Hz):', 27.5, 7040, 'logarithmic', 2,
				['slope', 'lfo'],
			),
		}

		this.enveloppe = {
			attack: valueParam(
				0.05,
				'Attack:', 0, 1, 'linear', 3,
			),
			delay: valueParam(
				0.05,
				'Delay:', 0, 1, 'linear', 3,
			),
			sustain: valueParam(
				0.7,
				'Sustain:', 0, 1, 'linear', 3,
			),
			release: valueParam(
				0.5,
				'Release:', 0, 1, 'linear', 3,
			),
		}

		this.phaser = {
			frequency: valueParam(
				440,
				'Frequency (Hz):', 27.5, 7040, 'logarithmic', 2,
				['slope', 'lfo'],
			),
			stages: valueParam(
				4,
				'Stages:', 1, 32, 'linear', 0,
			),
			q: valueParam(
				10,
				'Q:', 0, 100, 'linear', 3,
			),
			dryWet: valueParam(
				0.5,
				'dry/wet:', 0, 1, 'linear', 3,
			),
		}

		this.lowPass = {
			frequency: valueParam(
				1760,
				'Frequency (Hz):', 27.5, 7040, 'logarithmic', 2,
				['slope', 'lfo'],
			),
			q: valueParam(
				10,
				'Q:', 0, 100, 'linear', 3,
			),
		}

		this.highPass = {
			frequency: valueParam(
				110,
				'Frequency (Hz):', 27.5, 7040, 'logarithmic', 2,
				['slope', 'lfo'],
			),
			q: valueParam(
				10,
				'Q:', 0, 100, 'linear', 3,
			),
		}
	}

	get(path) {
		let param = this
		for(const name of path)
			param = param[name]
		return param
	}

	createParameters() {
		return this._createParameters(new Params(), this)
	}

	_createParameters(dst, src) {
		if(src.default !== undefined)
			return src.default
		for(const [name, meta] of Object.entries(src))
			dst[name] = this._createParameters({}, meta)
		return dst
	}
}


class Params {
	constructor() {
	}

	get(path) {
		let param = this
		for(const name of path)
			param = param[name]
		return param
	}

	set(path, value) {
		const last = path.length - 1
		const parent = this.get(path.slice(0, last))
		parent[path[last]] = value
	}
}

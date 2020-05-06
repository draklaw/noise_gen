import { waveTables } from '../wave_tables/index.js'


export default class ParamSet {
	constructor() {
		this.setValueParam('volume', -20,
			'Volume (dB):', -80, 0, 'linear', 2)
		this.setValueParam('duration', 1,
			'Duration (s):', 0.01, 100, 'logarithmic', 3)

		this.setChoiceParam('waveType', 'sine',
			'Wave type:',
			Array.from(Object.keys(waveTables))
				.concat(['white_noise'])
		)
		this.setValueParam('frequency', 440,
			'Frequency (Hz):', 27.5, 7040, 'logarithmic', 2,
			['slope', 'lfo'],
		)

		this.setValueParam('attack', 0.05,
			'Attack:', 0, 1, 'linear', 3)
		this.setValueParam('release', 0.5,
			'Release:', 0, 1, 'linear', 3)
		this.setValueParam('startVolume', 0,
			'Start volume (dB):', -80, 0, 'linear', 2)
		this.setValueParam('endVolume', 0,
			'End volume (dB):', -80, 0, 'linear', 2)

		this.setValueParam('lowPassFreq', 1760,
			'Low pass freq (Hz):', 27.5, 7040, 'logarithmic', 2)
		this.setValueParam('lowPassQ', 1,
			'Low pass Q:', 0, 10, 'linear', 3)
		this.setValueParam('highPassFreq', 110,
			'High pass freq (Hz):', 27.5, 7040, 'logarithmic', 2)
		this.setValueParam('highPassQ', 1,
			'High pass Q:', 0, 10, 'linear', 3)
	}

	createParameters() {
		const params = {}
		for(const [name, meta] of Object.entries(this))
			params[name] = meta.default
		return params
	}

	setValueParam(param, value, label, min, max, scale, decimals, options=[]) {
		this[param] = {
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

	setChoiceParam(param, value, label, choices) {
		this[param] = {
			type: 'choice',
			label: label,
			default: value,
			choices: choices,
		}
	}
}

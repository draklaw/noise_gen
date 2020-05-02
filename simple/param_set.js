import { waveTables } from '../wave_tables/index.js'


export default class ParamSet {
	constructor() {
		this.meta = {}

		this.setValueParam('volume', -20,
			'Volume (dB):', -80, 0, 'linear', 2)
		this.setValueParam('duration', 1,
			'Duration (s):', 0.01, 100, 'logarithmic', 3)

		this.setValueParam('attack', 0.05,
			'Attack:', 0, 1, 'linear', 3)
		this.setValueParam('release', 0.5,
			'Release:', 0, 1, 'linear', 3)
		this.setValueParam('startVolume', 1,
			'Start volume (dB):', -80, 0, 'linear', 2)
		this.setValueParam('endVolume', 1,
			'End volume (dB):', -80, 0, 'linear', 2)

		this.setChoiceParam('waveType', 'sine',
			'Wave type:',
			Array.from(Object.keys(waveTables))
				.concat(['white_noise'])
		)
		this.setValueParam('startFreq', 440,
			'Start frequency (Hz):', 27.5, 7040, 'logarithmic', 2)
		this.setValueParam('endFreq', 440,
			'End frequency (Hz):', 27.5, 7040, 'logarithmic', 2)

		this.setValueParam('lowPassFreq', 1760,
			'Low pass freq (Hz):', 27.5, 7040, 'logarithmic', 2)
		this.setValueParam('lowPassQ', 1,
			'Low pass Q:', 0, 10, 'linear', 3)
		this.setValueParam('highPassFreq', 110,
			'High pass freq (Hz):', 27.5, 7040, 'logarithmic', 2)
		this.setValueParam('highPassQ', 1,
			'High pass Q:', 0, 10, 'linear', 3)
	}

	setValueParam(param, value, label, min, max, scale, decimals) {
		this[param] = value
		this.meta[param] = {
			type: 'value',
			label: label,
			min: min,
			max: max,
			scale: scale,
			decimals: decimals,
		}
	}

	setChoiceParam(param, value, label, choices) {
		this[param] = value
		this.meta[param] = {
			type: 'choice',
			label: label,
			choices: choices,
		}
	}
}

'use strict';

const Oblak = require('../../Oblak');

let _oblak = null;
const getOblak = () => {
	if (!_oblak)
		_oblak = Oblak.debug();
	return _oblak;
};

const info = {
	description: 'Show info about the app components',

	async getOptionDefinitions() {
		return [
			{
				name: 'env',
				alias: 'e',
				type: String,
				defaultValue: 'development',
				description: 'select environment',
				typeLabel: '<env>',
			},
			{
				name: 'task',
				alias: 't',
				type: String,
				description: 'task path',
				defaultOption: true,
			},
		];
	},

	async run({ konzola }, arg) {
		const oblak = getOblak();
		const { help, all, ...options } = arg._none;
		const { services } = arg;

		konzola.info('Starting Oblak App...');
		// const ready = konzola.wait();

		await oblak.run({
			konzola,
			options,
			services,
		});

		// ready();
		konzola.info('Oblak is running');
		return null;
	},
};

module.exports = info;

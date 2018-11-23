'use strict';

const Oblak = require('../../Oblak');

let _oblak = null;
const getOblak = () => {
	if (!_oblak)
		_oblak = Oblak.debug();
	return _oblak;
};

const info = {
	description: 'Clear Oblak Data ( database )',

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
				name: 'all',
				type: String,
				defaultOption: true,
				doNotShowInfo: true,
			},
			{
				name: 'domain',
				alias: 'd',
				type: Boolean,
				group: 'services',
				description: 'clear domain services',
			},
			{
				name: 'denormalizer',
				alias: 'r',
				type: String,
				multiple: true,
				group: 'services',
				description: 'clear denormalizer services',
				typeLabel: '[denormalizers]',
			},
		];
	},

	async run({ konzola }, arg) {
		const oblak = getOblak();
		const { all } = arg._none;
		const { services } = arg;
		services.all = all === '.';

		konzola.info('Clearing Oblak App...');
		// const ready = konzola.wait();

		await oblak.clear();

		// ready();
		konzola.info('Oblak is cleared');
		process.exit(0);
		return null;
	},
};

module.exports = info;

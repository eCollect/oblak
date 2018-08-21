'use strict';

const getUsage = require('command-line-usage');
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
				description: 'run domain services',
			},
			{
				name: 'denormalizer',
				alias: 'r',
				type: String,
				multiple: true,
				group: 'services',
				description: 'run denormalizer services',
				typeLabel: '[denormalizers]',
			},
			{
				name: 'rest',
				alias: 'a',
				type: String,
				multiple: true,
				group: 'services',
				description: 'run REST services',
				typeLabel: '[rests]',
			},
		];
	},

	async run({ konzola, optionDefinitions }, arg) {
		const oblak = getOblak();
		const { help, all, ...options } = arg._none;
		const { services } = arg;
		services.all = all === '.';

		if (help)
			return konzola.info(getUsage([
				{ header: 'Options', optionList: [...(await this.getOptionDefinitions()).filter(i => !i.doNotShowInfo), ...optionDefinitions] },
			]));

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

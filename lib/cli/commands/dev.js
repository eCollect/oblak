'use strict';

const loadBootstrap = require('../loadBootstrap');

const info = {
	description: 'Run Oblak APP in development mode',

	async getOptionDefinitions() {
		return [{
			name: 'watch',
			alias: 'w',
			type: Boolean,
			description: 'watch for changes',
		}];
	},

	async run({ konzola }, arg) {
		const oblak = loadBootstrap();

		konzola.info('Starting Oblak App...');
		// const ready = konzola.wait();

		await oblak.init();

		// ready();
		konzola.info('Oblak is running!');
		return null;
	},
};

module.exports = info;

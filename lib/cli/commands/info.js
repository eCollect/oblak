'use strict';

const prepareOblak = require('../prepareOblak');

const info = {
	description: 'Show info about the app components',

	async getOptionDefinitions() {
		return [];
	},

	async run({ konzola }) {
		const oblak = prepareOblak();
		konzola.json({
			domain: oblak.domain,
			readmodels: oblak.readmodels,
			crudmodels: oblak.crudmodels,
		});
	},
};

module.exports = info;

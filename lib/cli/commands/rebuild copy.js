'use strict';

const loadBootstrap = require('../loadBootstrap');


const loadOblak = (konzola) => {
	const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	stop();
	process.stdout.clearLine();
	konzola.success('Oblak Bootstrap Loaded');
	return oblak;
};

const info = {
	description: 'Export Oblak Data ( database )',

	async getOptionDefinitions() {
		return [
			{
				name: 'readmodels',
				alias: 'r',
				type: String,
				multiple: true,
				defaultOption: true,
				typeLabel: 'readmodels[]',
				description: 'readmodel service name',
			},
		];
	},

	async run({ konzola }, arg) {
		const oblak = loadOblak(konzola, arg);

		if (arg.readmodels.includes('.'))
			arg.readmodels = true;
		await oblak.exec(konzola, 'rebuild', arg);


		await oblak._kellner.connections.close();

		const stop = konzola.wait({ text: 'Closing connection...' });
		await oblak.close();
		stop();
		process.stdout.clearLine();
		konzola.success('Done!');
	},
};

module.exports = info;

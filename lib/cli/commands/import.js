'use strict';

const fs = require('fs');

const loadBootstrap = require('../loadBootstrap');
const EventstoreStore = require('../../plugins/shared/Eventstore/index');

const { pipeline, JSONLinesParse } = require('../../utils/stream.js');

const loadOblak = (konzola) => {
	const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	stop();
	process.stdout.clearLine();
	konzola.success('Oblak Bootstrap Loaded.');
	return oblak;
};

const initModule = async (module, konzola, moduleName) => {
	const stop = konzola.wait({ text: `Initializing ${moduleName}...` });
	await module.init();
	stop();
	process.stdout.clearLine();
	konzola.success(`${moduleName} Initilized.`);
	return module;
};


const info = {
	description: 'Export Oblak Data ( database )',

	async getOptionDefinitions() {
		return [
			{
				name: 'in',
				alias: 'i',
				type: String,
				description: 'Input filename',
				defaultValue: './eventstore.export.jsonlines',
				typeLabel: '<in>',
			},
			{
				name: 'clear',
				alias: 'c',
				type: Boolean,
				description: 'Clear eventstore before import',
				defaultValue: false,
			},
		];
	},

	async run({ konzola }, arg) {
		const oblak = loadOblak(konzola, arg);
		const kellner = await initModule(oblak._kellner, konzola, 'Kellner');
		const store = await initModule(new EventstoreStore(kellner), konzola, 'Eventstore');

		if (arg.clear) {
			const stopClear = konzola.wait({ text: 'Clearing eventstore...' });
			await store.clear();
			stopClear();
			process.stdout.clearLine();
			konzola.success('Eventstore cleared.');
		}

		const importStream = store.getImportStream();

		const stop = konzola.wait({ text: 'Importing events...' });
		await pipeline(
			fs.createReadStream(arg.in),
			new JSONLinesParse(),
			importStream,
		);
		stop();
		process.stdout.clearLine();
		konzola.success(`${importStream.counter} event(s) imported.`);
		process.exit(0);
	},
};

module.exports = info;

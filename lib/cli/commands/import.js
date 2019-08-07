'use strict';

const fs = require('fs');

const yazul = require('yauzl');
const { promisify } = require('util');


const loadBootstrap = require('../loadBootstrap');
const EventstoreStore = require('../../plugins/shared/Eventstore/index');
const CrudModelStore = require('../../plugins/shared/CrudModelStore');
const ReadApi = require('../../plugins/shared/WireApi/ReadApi');
const Saga = require('../../plugins/Saga');

const { pipeline, JSONLinesParse, EJSONLinesParse } = require('../../utils/stream.js');
const { jsonDateParser } = require('../../utils/JSON.js');

const loadOblak = (konzola) => {
	const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	oblak._initServices();
	stop();
	process.stdout.clearLine();
	konzola.success('Oblak Bootstrap Loaded');
	return oblak;
};

const initModule = async (module, konzola, moduleName, ...params) => {
	const stop = konzola.wait({ text: `Initializing ${moduleName}...` });
	await module.init(...params);
	stop();
	process.stdout.clearLine();
	konzola.success(`${moduleName} Initilized`);
	return module;
};


const importHandlers = {
	async crud(getReadstream, type, typeName, {
		arg, konzola, crudStore,
	}) {
		const typeStore = crudStore.stores[type];
		const crudName = `crud:${type}:${typeName}`;

		if (arg.clear) {
			const stopClear = konzola.wait({ text: `[${crudName}] Clearing...` });
			await typeStore.clear(typeName);
			stopClear();
			process.stdout.clearLine();
			konzola.success(`[${crudName}] cleared.`);
		}

		const importStream = await typeStore.getImportStream(typeName);
		const stopImport = konzola.wait({ text: `Importing ${crudName}...` });
		await pipeline(
			await getReadstream(),
			// getDecryptStream(arg.password),
			new EJSONLinesParse(),
			importStream,
		);
		stopImport();
		process.stdout.clearLine();
		konzola.success(`[${crudName}] ${importStream.counter} document(s) imported.`);
	},
	async saga(getReadstream, type, typeName, {
		arg, oblak, kellner, sagas, konzola,
	}) {
		const saga = sagas[type][typeName];

		if (!saga){
			konzola.warn(`[saga:${type}:${typeName}] Not Found - skipping!`);
			return;
		}
		if (arg.clear) {
			const stopClear = konzola.wait({ text: `[${saga.name}] Clearing...` });
			await saga.internalClear(oblak, kellner);
			stopClear();
			process.stdout.clearLine();
			konzola.success(`[${saga.name}] cleared.`);
		}

		const importStream = await saga.getImportStream(kellner);
		const stopImport = konzola.wait({ text: `Importing ${saga.name}...` });
		await pipeline(
			await getReadstream(),
			// getDecryptStream(arg.password),
			new EJSONLinesParse(),
			importStream.stream,
		);
		stopImport();
		process.stdout.clearLine();
		konzola.success(`[${saga.name}] ${importStream.stream.counter} saga(s) imported.`);
	},
	async eventstore(getReadstream, type, typeName, {
		arg, konzola, store,
	}) {
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
			await getReadstream(),
			// getDecryptStream(arg.password),
			new EJSONLinesParse(),
			importStream,
		);
		stop();
		process.stdout.clearLine();
		konzola.success(`${importStream.counter} event(s) imported.`);
	},
};

const info = {
	description: 'Export Oblak Data ( database )',

	async getOptionDefinitions() {
		return [
			{
				name: 'in',
				alias: 'i',
				type: String,
				description: 'Export file',
				typeLabel: '<in>',
				defaultOption: true,
			},
			{
				name: 'clear',
				alias: 'c',
				type: Boolean,
				description: 'Clear eventstore before import',
				defaultValue: false,
			},
			{
				name: 'password',
				alias: 'p',
				type: String,
				description: 'Password for encryption',
				typeLabel: '<password>',
			},
		];
	},

	async _run({ konzola }, arg) {
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
			new JSONLinesParse({ parser: jsonDateParser }),
			importStream,
		);
		stop();
		process.stdout.clearLine();
		konzola.success(`${importStream.counter} event(s) imported.`);
		process.exit(0);
	},

	async run({ konzola }, arg) {
		if (!arg.in)
			throw new Error('No file specified');

		if (!fs.existsSync(arg.in))
			throw new Error(`${arg.in} not found.`);

		const startTime = new Date();

		const oblak = loadOblak(konzola, arg);
		const kellner = await initModule(oblak._kellner, konzola, 'Kellner');
		const wireApi = new ReadApi({
			app: kellner,
			wire: oblak,
			crud: oblak.crud,
			domain: oblak.domain,
			readmodels: oblak.readmodels,
			services: oblak.services,
			errors: oblak.errors,
		});
		const store = await initModule(new EventstoreStore(kellner), konzola, 'Eventstore');
		const crudStore = await initModule(new CrudModelStore(kellner), konzola, 'CrudStore', oblak, { wireApi });
		const sagas = new Saga().processes(oblak).reduce((acc, sagaService) => {
			acc[sagaService.type] = acc[sagaService.type] || {};
			acc[sagaService.type][sagaService.sagaName] = sagaService;
			return acc;
		}, {});

		const handlerOptions = {
			oblak,
			kellner,
			sagas,
			konzola,
			arg,
			store,
			crudStore,
		};

		await new Promise((resovle, reject) => {
			yazul.open(arg.in, { lazyEntries: true, validateEntrySizes: false }, (err, zipfile) => {
				if (err)
					return reject(zipfile);

				const openReadStream = promisify(zipfile.openReadStream.bind(zipfile));
				zipfile.on('entry', async (entry) => {
					const [handlerName, type, typeName] = entry.fileName.split('.');
					const handler = importHandlers[handlerName];
					if (handler)
						await handler(() => openReadStream(entry), type, typeName, handlerOptions);
					zipfile.readEntry();
				});
				zipfile.on('end', () => {
					resovle();
				});
				return zipfile.readEntry();
			});
		});

		konzola.success(`Imported ${arg.in} in ${Date.now() - startTime.getTime()}ms`);
		process.exit(0);


		/*
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
			new JSONLinesParse({ parser: jsonDateParser }),
			importStream,
		);
		stop();
		process.stdout.clearLine();
		konzola.success(`${importStream.counter} event(s) imported.`);
		process.exit(0);
		*/
	},
};

module.exports = info;

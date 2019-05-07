'use strict';

const fs = require('fs-extra');
const path = require('path');

const archiver = require('archiver');

const loadBootstrap = require('../loadBootstrap');
const EventstoreStore = require('../../plugins/shared/Eventstore/index');
const Saga = require('../../plugins/Saga');

const {
	pipeline, StatsStream, EJSONLinesStringify, CounterStream, /* getEncryptStream, */
} = require('../../utils/stream.js');

const loadOblak = (konzola) => {
	const stop = konzola.wait({ text: 'Loading Oblak Bootstrap...' });
	const oblak = loadBootstrap();
	oblak._load();
	stop();
	process.stdout.clearLine();
	konzola.success('Oblak Bootstrap Loaded');
	return oblak;
};

const initModule = async (module, konzola, moduleName) => {
	const stop = konzola.wait({ text: `Initializing ${moduleName}...` });
	await module.init();
	stop();
	process.stdout.clearLine();
	konzola.success(`${moduleName} Initilized`);
	return module;
};


const info = {
	description: 'Export Oblak Data ( database )',

	async getOptionDefinitions() {
		return [
			{
				name: 'out',
				alias: 'o',
				type: String,
				description: 'Output folder',
				// defaultValue: '___DEFAULT___',
				defaultOption: true,
				typeLabel: '<out>',
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
		const sagas = new Saga().processes(oblak);
		const startTime = new Date();

		const baseDir = path.join(arg.out, startTime.getTime().toString());
		await fs.ensureDir(baseDir);

		const exportStats = {
			oblak: '1.0.0',
			app: {
				name: oblak.name,
				version: oblak.version,
			},
			started: startTime.toISOString(),
			sagas: {},
			eventstores: {},
		};

		for (const saga of sagas) {
			const counterStream = new CounterStream();
			const {
				collectionName, stream, name, type, sagaName,
			} = await saga.getExportStream(kellner);
			const stop = konzola.wait({ text: `Exporting saga ${collectionName}...` });
			const sagaFile = `saga.${type}.${sagaName}.ejsonlines`;
			const targetPath = path.join(baseDir, sagaFile);
			await pipeline(
				stream,
				counterStream,
				new EJSONLinesStringify(),
				fs.createWriteStream(targetPath, { encoding: 'utf8' }),
			);
			exportStats.sagas[type] = exportStats.sagas[type] || {};

			exportStats.sagas[type][sagaName] = {
				name,
				collectionName,
				path: sagaFile,
				documents: counterStream.counter,
			};
			konzola.success(`[${name}]: ${counterStream.counter} saga(s) exported.`);
			stop();
		}

		const store = await initModule(new EventstoreStore(kellner), konzola, 'Eventstore');
		const counterStream = new CounterStream();
		const storeFile = 'eventstore.main.ejsonlines';
		const stop = konzola.wait({ text: 'Exporting events...' });
		await pipeline(
			store.getExportStream(),
			counterStream,
			new EJSONLinesStringify(),
			fs.createWriteStream(path.join(baseDir, storeFile), { encoding: 'utf8' }),
		);
		exportStats.eventstores.main = {
			path: storeFile,
			documents: counterStream.counter,
		};
		konzola.success(`${counterStream.counter} event(s) exported.`);
		stop();
		fs.writeFileSync(path.join(baseDir, 'export.json'), JSON.stringify(exportStats), { encoding: 'utf8' });
		konzola.success(`Exported to ${baseDir} in ${Date.now() - startTime.getTime()}ms`);
		process.exit(0);
	},
	async run({ konzola }, arg) {
		const oblak = loadOblak(konzola, arg);
		const kellner = await initModule(oblak._kellner, konzola, 'Kellner');
		const sagas = new Saga().processes(oblak);
		const store = await initModule(new EventstoreStore(kellner), konzola, 'Eventstore');
		const startTime = new Date();
		const out = arg.out || `exports/oblak.export.${startTime.getTime()}.oblakexp`;
		// const baseDir = path.join(arg.out, startTime.getTime().toString());
		await fs.ensureFile(out);

		const zipFileStream = fs.createWriteStream(out);
		const statsWriteStream = new StatsStream();
		const archive = archiver('zip', {
			zlib: { level: 9 }, // Sets the compression level.
		});

		const end = pipeline(
			archive,
			zipFileStream,
		);

		const onEnd = [];

		const stop = konzola.wait({ text: 'Exporting Oblak App...' });

		const exportStats = {
			oblak: '1.0.0',
			app: {
				name: oblak.name,
				version: oblak.version,
			},
			started: startTime.toISOString(),
			sagas: {},
			eventstores: {},
		};

		archive.append(statsWriteStream, { name: 'export.json' });

		// const stopSaga = konzola.wait({ text: `Exporting sagas...` });
		for (const saga of sagas) {
			const counterStream = new CounterStream();
			const {
				collectionName, stream, name, type, sagaName,
			} = await saga.getExportStream(kellner);
			const sagaFile = `saga.${type}.${sagaName}.ejsonlines`;
			const exportStream = stream.pipe(counterStream).pipe(new EJSONLinesStringify()); // .pipe(getEncryptStream(arg.password));
			archive.append(exportStream, { name: sagaFile });
			onEnd.push(() => {
				exportStats.sagas[type] = exportStats.sagas[type] || {};

				exportStats.sagas[type][sagaName] = {
					name,
					collectionName,
					path: sagaFile,
					documents: counterStream.counter,
				};
				konzola.success(`[${name}]: ${counterStream.counter} saga(s) exported.`);
			});
		}

		// const store = await initModule(new EventstoreStore(kellner), konzola, 'Eventstore');
		const counterStream = new CounterStream();
		const storeFile = 'eventstore.main.ejsonlines';
		const exportStream = store.getExportStream().pipe(counterStream).pipe(new EJSONLinesStringify()); // .pipe(getEncryptStream(arg.password));
		archive.append(exportStream, { name: storeFile });
		/*
		await pipeline(
			store.getExportStream(),
			counterStream,
			new EJSONLinesStringify(),
			fs.createWriteStream(path.join(baseDir, storeFile), { encoding: 'utf8' }),
		);
		*/
		onEnd.push(() => {
			exportStats.eventstores.main = {
				path: storeFile,
				documents: counterStream.counter,
			};
			konzola.success(`${counterStream.counter} event(s) exported.`);
		});
		// fs.writeFileSync(path.join(baseDir, 'export.json'), JSON.stringify(exportStats), { encoding: 'utf8' });
		statsWriteStream.finalize(exportStats);
		archive.finalize();
		await end;
		stop();
		for (const endFn of onEnd)
			endFn();
		konzola.success(`Exported to ${out} in ${Date.now() - startTime.getTime()}ms`);
		process.exit(0);
	},
};

module.exports = info;

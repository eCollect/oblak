'use strict';

const fs = require('fs-extra');
const path = require('path');

const archiver = require('archiver');

const loadBootstrap = require('../loadBootstrap');
const EventstoreStore = require('../../plugins/shared/Eventstore/index');
const Saga = require('../../plugins/Saga');
const CrudModelStore = require('../../plugins/shared/CrudModelStore');
const ReadApi = require('../../plugins/shared/WireApi/ReadApi');

const {
	pipeline, StatsStream, EJSONLinesStringify, CounterStream, /* getEncryptStream, */
} = require('../../utils/stream.js');

class EndListener {
	constructor() {
		this._awaiting = 0;
		this._resolve = () => {};
		this._isResolved = false;
	}

	add() {
		this._awaiting += 1;
	}

	end() {
		this._awaiting -= 1;
		if (this._awaiting === 0)
			this._fireResolve();
	}

	async await() {
		if (this._isResolved)
			return;
		// eslint-disable-next-line consistent-return
		return new Promise((resolve) => {
			this._resolve = resolve;
		});
	}

	_fireResolve() {
		this._isResolved = true;
		this._resolve();
	}
}

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
	async run({ konzola, version }, arg) {
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
		const sagas = new Saga().processes(oblak);
		const startTime = new Date();
		const out = arg.out || `exports/${oblak.name}.${startTime.getTime()}.oblakexport`;

		// console.log(oblak.crud);

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

		const endListener = new EndListener();

		const stop = konzola.wait({ text: 'Exporting Oblak App...' });

		const exportStats = {
			oblak: version,
			app: {
				name: oblak.name,
				version: oblak.version,
			},
			started: startTime.toISOString(),
			sagas: {},
			crud: {},
			eventstores: {},
		};

		archive.append(statsWriteStream, { name: 'export.json' });


		for (const [type, cs] of Object.entries(crudStore.stores))
			for (const crudName of Object.keys(cs.collections)) {
				const crudFile = `crud.${type}.${crudName}.ejsonlines`;
				const counterStream = new CounterStream();
				const stream = cs.getExportStream(crudName);
				const exportStream = stream.pipe(counterStream).pipe(new EJSONLinesStringify()); // .pipe(getEncryptStream(arg.password));
				archive.append(exportStream, { name: crudFile });
				endListener.add();
				exportStream.on('end', () => {
					endListener.end();
					exportStats.crud[type] = exportStats.crud[type] || {};

					exportStats.crud[type][crudName] = {
						path: crudFile,
						documents: counterStream.counter,
					};
					konzola.success(`[crud:${type}:${crudName}]: ${counterStream.counter} document(s) exported.`);
				});
			}

		// const stopSaga = konzola.wait({ text: `Exporting sagas...` });
		for (const saga of sagas) {
			const counterStream = new CounterStream();
			const {
				collectionName, stream, name, type, sagaName,
			} = await saga.getExportStream(kellner);
			const sagaFile = `saga.${type}.${sagaName}.ejsonlines`;
			const exportStream = stream.pipe(counterStream).pipe(new EJSONLinesStringify()); // .pipe(getEncryptStream(arg.password));
			archive.append(exportStream, { name: sagaFile });
			endListener.add();
			exportStream.on('end', () => {
				endListener.end();
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
		endListener.add();
		exportStream.on('end', () => {
			endListener.end();
			exportStats.eventstores.main = {
				path: storeFile,
				documents: counterStream.counter,
			};
			konzola.success(`${counterStream.counter} event(s) exported.`);
		});
		// fs.writeFileSync(path.join(baseDir, 'export.json'), JSON.stringify(exportStats), { encoding: 'utf8' });
		statsWriteStream.finalize(exportStats);
		await endListener.await();
		archive.finalize();
		await end;
		stop();
		konzola.success(`Exported to ${out} in ${Date.now() - startTime.getTime()}ms`);
		process.exit(0);
	},
};

module.exports = info;

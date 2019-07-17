'use strict';

const { promisify } = require('util');
const path = require('path');

const builder = require('cqrs-swissknife/saga/builder');
const cqrsSaga = require('cqrs-saga');

const storeOptions = require('../shared/storeOptions');

const { OblakTransform } = require('../shared/streams');
const { DocumentsImportStream } = require('../../utils/stream');

const flattenSagas = sagas => Object.values(sagas).reduce((arr, sagasArray) => [...arr, ...sagasArray], []);

const oneOrArray = arr => (arr.length < 2 ? arr[0] : arr);

module.exports = class SagaStream extends OblakTransform {
	constructor(app, wire) {
		super(app);
		this.Event = app.Event;
		this.wire = wire;
	}

	async _init(oblak) {
		const sagaStore = storeOptions(this.app.config.sagas[this.wire.type], this.app);

		delete sagaStore.url;

		const sagaApiBuilder = ({ metadata }, saga) => this.wire.wireApi.get(metadata, saga);

		this.processManager = cqrsSaga({
			sagaStore,
			revisionGuard: false,
			sagaPath: path.join(oblak.paths.sagas, this.wire.type),
			structureLoader: ({ definitions }) => flattenSagas(builder({ [`${[this.wire.type]}:${this.wire.sagaName}`]: oblak.sagas[this.wire.type].sagas[this.wire.sagaName] }, definitions, sagaApiBuilder)),
		}).defineEvent(this.app.Event.definition()).defineCommand(this.app.Command.definition());

		this.processManager.on('disconnect', e => this.emit('disconnect', e));

		this.processManager.onCommand((command, next) => this.push({ command, next }));

		const init = promisify(this.processManager.init.bind(this.processManager));

		await init();
		// const info = this.processManager.getInfo();
		this.logger = this.app.services.getLogger();
	}

	async init(oblak) {
		const sagaStore = storeOptions(this.app.config.sagas[this.wire.type], this.app);

		delete sagaStore.url;

		const sagaApiBuilder = ({ metadata }, saga) => this.wire.wireApi.get(metadata, saga);

		this.processManager = cqrsSaga({
			sagaStore,
			revisionGuard: false,
			sagaPath: path.join(oblak.paths.sagas, this.wire.type),
			structureLoader: ({ definitions }) => flattenSagas(builder({ [`${[this.wire.type]}:${this.wire.sagaName}`]: oblak.sagas[this.wire.type].sagas[this.wire.sagaName] }, definitions, sagaApiBuilder)),
		}).defineEvent(this.app.Event.definition()).defineCommand(this.app.Command.definition());

		this.processManager.on('disconnect', e => this.emit('disconnect', e));

		this.processManager.onCommand((command, next) => this.push({ command, next }));

		const init = promisify(this.processManager.init.bind(this.processManager));

		await init();
		// const info = this.processManager.getInfo();
		this.logger = this.app.services.getLogger();
	}

	async getExportStream() {
		const { dbName, collectionName } = storeOptions(this.app.config.sagas[this.wire.type], this.app);
		// console.log(sagaStore);
		const mongoClient = await this.app.connections.get('mongodb');
		// const { eventsCollectionName, dbName } = repositoryOptions(this.app.config.eventStore, this.app);
		const db = mongoClient.db(dbName);
		const collection = db.collection(collectionName);
		return {
			type: this.wire.type,
			name: this.wire.name,
			sagaName: this.wire.sagaName,
			collectionName,
			stream: collection.find({}).sort({ _commitStamp: -1 }),
		};
	}

	async getImportStream() {
		const { dbName, collectionName } = storeOptions(this.app.config.sagas[this.wire.type], this.app);
		// console.log(sagaStore);
		const mongoClient = await this.app.connections.get('mongodb');
		// const { eventsCollectionName, dbName } = repositoryOptions(this.app.config.eventStore, this.app);
		const db = mongoClient.db(dbName);
		const collection = db.collection(collectionName);
		return {
			type: this.wire.type,
			name: this.wire.name,
			sagaName: this.wire.sagaName,
			collectionName,
			stream: new DocumentsImportStream(collection),
		};
	}

	// use with extreme care
	async clear() {
		await promisify(this.processManager.sagaStore.clear.bind(this.processManager.sagaStore))();
		await this.processManager.sagaStore.store.drop();
	}

	// special clear with init
	async externalClear(oblak) {
		const sagaStore = storeOptions(this.app.config.sagas[this.wire.type], this.app);

		const sagaApiBuilder = ({ metadata }, saga) => this.wire.wireApi.get(metadata, saga);

		this.processManager = cqrsSaga({
			sagaStore,
			revisionGuard: false,
			sagaPath: path.join(oblak.paths.sagas, this.wire.type),
			structureLoader: ({ definitions }) => flattenSagas(builder({ [`${[this.wire.type]}:${this.wire.sagaName}`]: oblak.sagas[this.wire.type].sagas[this.wire.sagaName] }, definitions, sagaApiBuilder)),
		}).defineEvent(this.app.Event.definition()).defineCommand(this.app.Command.definition());

		const init = promisify(this.processManager.init.bind(this.processManager));
		await init();
		await promisify(this.processManager.sagaStore.clear.bind(this.processManager.sagaStore))();
		await this.processManager.sagaStore.store.drop();
	}

	_transform(evt, _, done) {
		const serializedEvent = evt.serialize();
		this.processManager.handle(serializedEvent, (errs) => {
			if (errs && errs[0].name !== 'AlreadyHandledError') {
				this.app.services.getLogger().error(oneOrArray(errs), `Saga Handle Error ${this.wire.name}`);
				return evt.ack();
			}
			return evt.ack();
		});
		done(null);
	}
};

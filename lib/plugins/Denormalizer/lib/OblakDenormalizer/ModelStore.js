'use strict';

const sift = require('sift').default;

const queryParser = require('../../../../queryParser');
const { ReadableObservableStream } = require('../../../../utils/stream');
const SingleSemaphore = require('../../../../utils/async/SingleSemaphore');

const QueryBuilder = require('../../../shared/ReadmodelsStore/QueryBuilder');

const ConcurrencyError = require('./errors/ConcurrencyError');


class InMemoryFindQuery {
	constructor(query, metadata, options, { collection }) {
		this.collection = collection;
		this.query = query;
		this.metadata = metadata;

		this.backupQueryExecutor = this.collection.getBackupQueryExecutor().query(query, metadata, options);
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	async exec() {
		await this.collection.flush(true);
		return this.backupQueryExecutor.exec();
	}

	// eslint-disable-next-line class-methods-use-this
	stream() {
		throw new Error('Not possible in replay mode :(');
	}
}

class InMemoryGetQuery {
	constructor(id, metadata, options, { collection }) {
		this.collection = collection;
		this.id = id;
		this.metadata = metadata;
		this.backupQueryExecutorFactory = () => this.collection.getBackupQueryExecutor().get(id, metadata, options);
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	catch(handler) {
		return this.exec().catch(handler);
	}

	async exec() {
		const vm = this.collection.get(this.id, true);
		if (!vm) {
			await this.collection._lock.wait();
			return this.backupQueryExecutorFactory().exec();
		}
		return vm.toArray();
	}

	stream() {
		const vm = this.collection.get(this.id, true);
		if (!vm)
			return this.backupQueryExecutorFactory().stream();
		return vm.stream();
	}
}

class InMemoryQueryExecutor {
	constructor(collection) {
		this.collection = collection;
	}

	raw(raw, metadata, options) {
		return new InMemoryFindQuery(raw, metadata, options, this);
	}

	get(id, metadata, options) {
		return new InMemoryGetQuery(id, metadata, options, { collection: this.collection });
	}

	query(query, metadata, options) {
		return new InMemoryFindQuery(query, metadata, options, { collection: this.collection });
	}

	base() {
		return this.collection;
	}
}

class InMemoryCollection {
	constructor(type, modelName, backupStore) {
		this._buffer = new Map();
		this._backupStore = backupStore;
		this._flushed = false;
		this._lock = new SingleSemaphore();

		this.modelName = modelName;
		this.type = type;
	}

	addOrUpdate(vm) {
		this._buffer.set(vm.id, vm);
		return vm.attributes;
	}

	async find(query) {
		if (this._flushed) {
			await this.flush({ find: query });
			return false;
		}

		const source = this._buffer.values();
		return {
			toArray: async () => {
				const filterAttributes = sift(query);
				return source.filter(filterAttributes);
			},
			stream: () => {
				const filterAttributes = sift(query);
				return new ReadableObservableStream({ source, filter: ({ attributes }) => filterAttributes(attributes) }, { objectMode: true });
			},
		};
	}

	get(id, onlyAttributes = false) {
		const vm = this._buffer.get(id);
		if (!vm && this._flushed)
			return false;

		const source = vm ? [(onlyAttributes ? vm.attributes : vm)] : [];
		return {
			toArray: async () => source,
			stream: () => new ReadableObservableStream({ source }, { objectMode: true }),
		};
	}

	getBackupQueryExecutor() {
		return this._backupStore.getQueryExecutor(this.modelName);
	}

	async flush() {
		await this._lock.acquire();
		const flashedWas = this._flushed;
		this._flushed = true;
		const fulshed = await this._backupStore.batchSaveViewModels(this.modelName, this._buffer);
		if (fulshed.concurrencyError)
			throw ConcurrencyError.fromReply({ type: this.type, collection: this.modelName });
		this._flushed = flashedWas || !!fulshed;
		this._buffer.clear();
		await this._lock.free();
	}
}

class ModelStore {
	constructor({
		type,
		dbModelStore,
	}) {
		this.ViewModelStream = dbModelStore.ViewModelStream;
		this.dbModelStore = dbModelStore;
		this.buffers = {};

		Object.keys(dbModelStore.collections || dbModelStore.indexes).forEach((col) => {
			this.buffers[col] = new InMemoryCollection(type, col, dbModelStore);
		});
	}

	async init(readmodels) {
		this.dbModelStore.init(readmodels);

		Object.keys(this.collections).forEach((col) => {
			this.buffers[col] = [];
		});

		return this;
	}

	collection(modelName) {
		return this.dbModelStore.collection(modelName);
	}

	read(modelName, query = {}, authQuery = true) {
		return this.dbModelStore.read(modelName, query, authQuery);
	}

	query(modelName, metadata, id) {
		const buf = this.buffers[modelName];
		return new QueryBuilder(new InMemoryQueryExecutor(buf), metadata, id);
	}

	findOne(modelName, id) {
		return this.dbModelStore.query(modelName, id);
	}

	find(modelName, query) {
		return this.dbModelStore.query(modelName, query);
	}

	// write side
	async createIndexes() {
		return this.dbModelStore.createIndexes();
	}

	async findViewmodel(modelName, { query, id }) {
		const buffer = this.buffers[modelName];
		if (id) {
			const local = buffer.get(id);
			if (local)
				return local;
			await buffer._lock.wait();
			return {
				stream: () => this.dbModelStore.findViewmodel(modelName, { query, id }).stream(),
			};
		}

		const filter = queryParser.translate.mongo({ filter: query }).find;
		const inMemory = await buffer.find(filter);
		return inMemory || {
			stream: () => this.dbModelStore.findViewmodel(modelName, { query, id }).stream(),
		};
	}

	async saveViewmodel(model, vm) {
		const buffer = this.buffers[model];
		const value = buffer.addOrUpdate(vm);
		return {
			value,
			concurrencyError: false,
		};
	}

	async getLastEventData(model) {
		return this.dbModelStore.getLastEventData(model);
	}

	async flush() {
		for (const buf of Object.values(this.buffers))
			await buf.flush(true);
	}

	// use with care
	async clear() {
		return this.dbModelStore.clear();
		// await this.createIndexes();
	}
}


module.exports = ModelStore;

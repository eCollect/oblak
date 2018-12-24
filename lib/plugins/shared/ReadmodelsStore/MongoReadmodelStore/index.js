'use strict';

const mquery = require('mquery');

const MongoReadStream = require('./MongoReadStream');
const FindOneStream = require('./FindOneStream');

const { findWithAuth } = require('./authQueryParser');

const queryParser = require('../../../../queryParser');

const normalizeIndexSpec = (collection, index) => {
	const result = {
		collection,
		index: index.index || index,
		options: index.options || undefined,
	};

	if (typeof result.index === 'string')
		result[index] = { [result.index]: 1 };
	return result;
};

class MongoReadmodelStore {
	constructor(app, repository) {
		this.app = app;
		this.repository = repository;
		this.db = null;
		this.collections = {};
	}

	async init(readmodels) {
		const mongoClient = await this.app.connections.get('mongodb');
		this.db = mongoClient.db(this.repository.dbName);
		const indexCreation = [];
		Object.entries(readmodels).forEach(([readmodel, { indexes = [] }]) => {
			// todo optimize indexes!
			this.collections[readmodel] = this.db.collection(readmodel);
			indexes.forEach(indexSpec => indexCreation.push(normalizeIndexSpec(readmodel, indexSpec)));
		});
		for (const { collection, index, options } of indexCreation)
			await this.db.createIndex(collection, index, options);
		return this;
	}

	collection(modelName) {
		if (!this.collections[modelName])
			throw new Error(`Readmodel mongo.${modelName} not found.`);
		return this.collections[modelName];
	}

	read(modelName, query = {}, authQuery = true) {
		const parsedQuery = queryParser.translate.mongo(query);
		const collection = this.collection(modelName);
		const cursor = collection.find(findWithAuth(parsedQuery.find, authQuery));
		if (parsedQuery.sort)
			cursor.sort(parsedQuery.sort);
		cursor.skip(parsedQuery.from);
		cursor.limit(parsedQuery.size);

		return new MongoReadStream(cursor);
	}

	readOne(modelName, query = {}) {
		const collection = this.collection(modelName);
		const cursor = collection.findOne(query);
		return new FindOneStream(cursor);
	}


	query(modelName, metadata, id) {
		const baseQuery = mquery(this.collection(modelName));
		if (id)
			return baseQuery.findOne({ _id: id });
		return baseQuery.find();
	}

	queryOne(modelName, metadata, id) {
		const baseQuery = mquery(this.collection(modelName));
		if (id)
			return baseQuery.findOne({ _id: id });
		return baseQuery.findOne();
	}

	findOne(modelName, id) {
		return this.collection(modelName).findOne({ _id: id });
	}

	find(modelName, query) {
		return this.collection(modelName).find(query);
	}
}

class MongoReadmodelStoreWritable extends MongoReadmodelStore {
	async init(readmodels) {
		await super.init(readmodels.reduce((acc, c) => {
			acc[c.name] = c.repositorySettings.mongodb || {};
			return acc;
		}, {}));
		return this;
	}

	// 	async handleOperationAdd(model, { data }) {
	// writeable operations
	async handleOperationAdd(model, { data }) {
		await this.collection(model).insertOne(data);
		return {
			operation: 'create',
			payload: data,
			modifiedCount: 1,
		};
	}

	async handleOperationUpdate(model, { find, data }) {
		const filter = queryParser.translate.mongo({ filter: find }).find;
		const payload = queryParser.payload.translate.mongo(data);
		const { modifiedCount } = await this.collection(model).updateMany(filter, payload);
		return { operation: 'update', modifiedCount };
	}

	async saveViewmodel(model, vm) {
		const collection = this.collection(model);
		return collection.findOneAndUpdate({ _id: vm.id }, { $set: vm.attributes }, { upsert: true, returnOriginal: false });
	}

	async getLastEventData(model) {
		const collection = this.collection(model);
		return collection.find({}).sort({ '_oblak.event.position': -1 }).project({ _id: 0, '_oblak.event': 1 }).limit(1)
			.batchSize(1)
			.next();
		// return collection.findOneAndUpdate({ _id: vm.id }, { $set: vm.attributes }, { upsert: true, new: true });
	}

	// use with care
	async clear() {
		return Promise.all(Object.values(this.collections).map(c => c.drop().catch(() => {})));
	}
}

MongoReadmodelStore.Writable = MongoReadmodelStoreWritable;

module.exports = MongoReadmodelStore;

'use strict';

const mquery = require('mquery');

const MongoReadStream = require('./MongoReadStream');
const FindOneStream = require('./FindOneStream');

const { findWithAuth } = require('./authQueryParser');

const queryParser = require('../../../../queryParser');

class MongoReadmodelStore {
	constructor(app, repository) {
		this.app = app;
		this.repository = repository;
		this.db = null;
		this.collections = [];
	}

	async init(readmodels) {
		const mongoClient = await this.app.connections.get('mongodb');
		this.db = mongoClient.db(this.repository.dbName);
		Object.keys(readmodels).forEach((readmodel) => {
			// todo optimize indexes!
			this.collections[readmodel] = this.db.collection(readmodel);
		});
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
}

class MongoReadmodelStoreWritable extends MongoReadmodelStore {
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

	// use with care
	async clear() {
		await this.db.dropDatabase();
	}
}

MongoReadmodelStore.Writable = MongoReadmodelStoreWritable;

module.exports = MongoReadmodelStore;

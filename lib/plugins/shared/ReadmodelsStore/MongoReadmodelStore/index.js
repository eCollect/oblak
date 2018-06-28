'use strict';

const mquery = require('mquery');

module.exports = class MongoReadmodelStore {
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

	read(modelName, query = {}) {
		const collection = this.collection(modelName);
		const cursor = collection.find(query);
		return cursor.stream();
	}

	readOne(modelName, query = {}) {
		const collection = this.collection(modelName);
		const cursor = collection.findOne(query);
		return cursor.stream();
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
};
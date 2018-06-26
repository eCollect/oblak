'use strict';

const elasticReadModel = require('./elasticReadModel');

module.exports = class ElasticReadmodelStore {
	constructor(app, repository) {
		this.app = app;
		this.repository = repository;
		this.db = null;
		this.indexes = {};
	}

	async init(readmodels) {
		this.db = await this.app.connections.get('elastic');

		Object.keys(readmodels).forEach((readmodel) => {
			// todo optimize indexes!
			this.indexes[readmodel] = {
				index: `${this.repository.index}.${readmodel}`,
			};
		});
		return this;
	}

	collection(modelName) {
		if (!this.indexes[modelName])
			throw new Error(`Readmodel mongo.${modelName} not found.`);
		return this.indexes[modelName];
	}

	query(modelName) {
		return elasticReadModel(this.db, this.indexes[modelName]);
	}
};

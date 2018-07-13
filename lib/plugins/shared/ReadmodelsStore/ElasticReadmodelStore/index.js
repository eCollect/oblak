'use strict';

const elasticReadModel = require('./elasticReadModel');
const ReadModel = require('./ReadModel');

const queryParser = require('./queryParser');

const readmodelInfo = (repository, [name, { path }]) => {
	const index = `${repository.index}.${name}`;
	const { repositorySettings = {} } = require(path);
	const { oblak = {} } = repositorySettings;
	const { aggregators = {} } = oblak;
	return {
		name,
		index,
		aggregators,
	};
}

module.exports = class ElasticReadmodelStore {
	constructor(app, repository) {
		this.app = app;
		this.repository = repository;
		this.db = null;
		this.indexes = {};
	}

	async init(readmodels) {
		this.db = await this.app.connections.get('elastic');

		Object.entries(readmodels).forEach((entry) => {
			const { name, ...info } = readmodelInfo(this.repository, entry)
			// todo optimize indexes!
			this.indexes[name] = info;
		});
		return this;
	}

	read(modelName, query = {}, authQuery = true, stream = false) {
		const info = this.indexes[modelName];
		const model = new ReadModel(this.db, info);
		return model.read(query);
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

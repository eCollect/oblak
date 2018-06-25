'use strict';

const typedStores = {
	mongodb: require('./MongoReadmodelStore'), // eslint-disable-line
};

const storeOptions = require('../storeOptions');

const arrayToObj = (arr, value, name = v => v) => arr.reduce((obj, item) => {
	const predicateResult = value(item);
	if (predicateResult)
		obj[name(item)] = predicateResult;
	return obj;
}, {});

module.exports = class ReadmodelsStore {
	constructor(app) {
		this.app = app;
		this.stores = {};
	}

	async init({ readmodels }) {
		await Object.entries(readmodels).reduce(async (prm, [type, models]) => {
			await prm;

			if (!this.app.config.denormalizers[type])
				return;

			const repositoryOptions = storeOptions(this.app.config.denormalizers[type], this.app);

			if (!typedStores[repositoryOptions.type])
				return;

			this.stores[type] = await new typedStores[repositoryOptions.type](this.app, repositoryOptions).init(models);
		}, Promise.resolve());

		return this.stores;
	}

	buildBaseApi({ readmodels }) {
		return Object.entries(readmodels).reduce((api, [type, models]) => {
			api[type] = arrayToObj(Object.keys(models), modelName => id => this.query(type, modelName, id));
			return api;
		}, {});
	}

	model(type, modelName) {
		if (!(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);
		return this.stores[type].model(modelName);
	}

	query(type, modelName, metadata, id) {
		if (!(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);
		return this.stores[type].query(modelName, metadata, id);
	}
};

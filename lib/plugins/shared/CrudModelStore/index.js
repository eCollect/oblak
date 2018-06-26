'use strict';

const typedStores = {
	mongoose: require('./MongooseCrudModelStore'), // eslint-disable-line
};

const storeOptions = require('../storeOptions');

const arrayToObj = (arr, value, name = v => v) => arr.reduce((obj, item) => {
	const predicateResult = value(item);
	if (predicateResult)
		obj[name(item)] = predicateResult;
	return obj;
}, {});

module.exports = class CrudModelStore {
	constructor(app) {
		this.app = app;
		this.stores = {};
	}

	async init({ crud }, { wireApi }) {
		const api = wireApi.get();

		await Object.entries(crud).reduce(async (prm, [type, models]) => {
			await prm;

			if (!this.app.config.crud[type])
				return;

			const repositoryOptions = storeOptions(this.app.config.crud[type], this.app);

			if (!typedStores[repositoryOptions.type])
				return;

			this.stores[type] = await new typedStores[repositoryOptions.type](this.app, repositoryOptions, type).init(models, api);
		}, Promise.resolve());

		return this.stores;
	}

	buildBaseApi({ crud }) {
		return Object.entries(crud).reduce((api, [type, models]) => {
			api[type] = arrayToObj(Object.keys(models.collections), modelName => id => this.model(type, modelName, id));
			return api;
		}, {});
	}

	model(type, modelName, id) {
		if (!(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);
		return this.stores[type].model(modelName, id);
	}
};

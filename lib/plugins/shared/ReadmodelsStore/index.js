'use strict';

const ElasticReadmodelStore = require('./ElasticReadmodelStore');
const MongoReadmodelStore = require('./MongoReadmodelStore');

const typedStores = {
	// Mongo DB ( 3.6 + )
	mongo: MongoReadmodelStore,
	mongodb: MongoReadmodelStore,
	// Elasticsearch 5.X+ ( compatible wit 6.X also )
	elasticsearch: ElasticReadmodelStore,
	elasticsearch6: ElasticReadmodelStore,
};

const storeOptions = require('../storeOptions');

const arrayToObj = (arr, value, name = v => v) => arr.reduce((obj, item) => {
	const predicateResult = value(item);
	if (predicateResult)
		obj[name(item)] = predicateResult;
	return obj;
}, {});

module.exports = class ReadmodelsStore {
	constructor(app, wire) {
		this.app = app;
		this.wire = wire;
		this.stores = {};
	}

	static getTypedStore(app, repositoryOptions, writable = false) {
		return !writable ? new typedStores[repositoryOptions.type](app, repositoryOptions) : new typedStores[repositoryOptions.type].Writable(app, repositoryOptions);
	}

	canAccess(type, modelName, metadata) {
		const authQuery = this.app.canAccess.readmodel(type, modelName, metadata);
		if (!authQuery)
			throw new this.app.canAccess.UnauthorizedError();
		return authQuery.query || true;
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

	// streaming api
	read({ type, collection }, metadata, query) {
		if (!(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);

		const authQuery = this.canAccess(type, collection, metadata);
		return this.stores[type].read(collection, query, authQuery);
	}

	readOne({ type, collection }, metadata, query) {
		if (!(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);

		const authQuery = this.canAccess(type, collection, metadata);
		return this.stores[type].readOne(collection, query);
	}

	// query api
	query(type, modelName, metadata, id, { readmodelStores = this.stores } = {}) {
		if (!(type in readmodelStores) && !(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);

		const authQuery = this.canAccess(type, modelName, metadata);
		const store = readmodelStores[type] || this.stores[type];

		return store.query(modelName, metadata, id);
	}

	queryOne(type, modelName, metadata, id, { readmodelStores = this.stores } = {}) {
		if (!(type in readmodelStores) && !(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);

		const authQuery = this.canAccess(type, modelName, metadata);
		const store = readmodelStores[type] || this.stores[type];
		return store.queryOne(modelName, metadata, id);
	}

	model(type, modelName) {
		if (!(type in this.stores))
			throw new Error(`No readmodel store of type ${type} initialized.`);
		return this.stores[type].model(modelName);
	}
};

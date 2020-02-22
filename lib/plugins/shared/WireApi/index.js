'use strict';

const buildDomainClass = require('./buildDeferredDomainClass');
const buildReadmodelsClass = require('./buildReadmodelsClass');
const buildCrudmodelsClass = require('./buildCrudmodelsClass');
const buildWorkersClass = require('./buildWorkersClass');
const {
	crudmodelsSymbol,
	readmodelsSymbol,
	domainSymbol,
	servicesSymbol,
	errorsSymbol,
	wireSymbol,
	eventstoreSymbol,
	workersSymbol,
	cacheSymbol,
} = require('./symbols');


class InstanceCache {
	constructor() {
		this._cache = {};
	}

	get(key, factory) {
		if (!this._cache[key])
			this._cache[key] = factory();
		return this._cache[key];
	}
}

class WireApi {
	constructor({
		app,
		wire,
		domain,
		crud,
		readmodels,
		services,
		workers,
		errors,
	}) {
		this[wireSymbol] = wire;
		this[domainSymbol] = buildDomainClass({ app, wire, domain });
		this[readmodelsSymbol] = buildReadmodelsClass({ wire, readmodels });
		this[crudmodelsSymbol] = buildCrudmodelsClass({ wire, crud });
		this[workersSymbol] = buildWorkersClass({ wire, workers });
		this[eventstoreSymbol] = wire.eventstore;
		this[servicesSymbol] = wire.servicesStore.buildBaseApi({ services });
		this[cacheSymbol] = new InstanceCache();
		this[errorsSymbol] = errors;
		this.name = wire.name;
	}

	get(metadata, wire = this[wireSymbol]) {
		return {
			wire: this[wireSymbol],
			getDomain: () => new this[domainSymbol](metadata, wire),
			getReadmodels: () => new this[readmodelsSymbol](metadata),
			getCrud: () => this[cacheSymbol].get('crud', () => new this[crudmodelsSymbol](metadata)),
			getWorkers: () => {
				if (!this[cacheSymbol].workers)
					this[cacheSymbol].workers = new this[workersSymbol](metadata);
				return this[cacheSymbol].workers;
			},
			getEventstore: () => this[eventstoreSymbol],
			getServices: () => this[servicesSymbol],
			getLogger: () => this[wireSymbol].app.services.getLogger(),
			errors: this[errorsSymbol],
		};
	}
}

module.exports = WireApi;

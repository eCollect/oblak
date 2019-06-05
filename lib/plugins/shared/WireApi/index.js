'use strict';

const buildDomainClass = require('./buildDeferredDomainClass');
const buildReadmodelsClass = require('./buildReadmodelsClass');
const buildCrudmodelsClass = require('./buildCrudmodelsClass');
const {
	crudmodelsSymbol,
	readmodelsSymbol,
	domainSymbol,
	servicesSymbol,
	errorsSymbol,
	wireSymbol,
	eventstoreSymbol,
} = require('./symbols');


class WireApi {
	constructor({
		app,
		wire,
		domain,
		crud,
		readmodels,
		services,
		errors,
	}) {
		this[wireSymbol] = wire;
		this[domainSymbol] = buildDomainClass({ app, wire, domain });
		this[readmodelsSymbol] = buildReadmodelsClass({ wire, readmodels });
		this[crudmodelsSymbol] = buildCrudmodelsClass({ wire, crud });
		this[eventstoreSymbol] = wire.eventstore;
		this[servicesSymbol] = wire.servicesStore.buildBaseApi({ services });
		this[errorsSymbol] = errors;
		this.name = wire.name;
	}

	get(metadata, wire = this[wireSymbol]) {
		return {
			wire: this[wireSymbol],
			getDomain: () => new this[domainSymbol](metadata, wire),
			getReadmodels: () => new this[readmodelsSymbol](metadata),
			getCrud: () => new this[crudmodelsSymbol](metadata),
			getEventstore: () => this[eventstoreSymbol],
			getServices: () => this[servicesSymbol],
			getLogger: () => this[wireSymbol].app.services.getLogger(),
			errors: this[errorsSymbol],
		};
	}
}

module.exports = WireApi;

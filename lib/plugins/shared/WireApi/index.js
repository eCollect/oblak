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
		this[servicesSymbol] = wire.servicesStore.buildBaseApi({ services });
		this[errorsSymbol] = errors;
	}

	get(metadata, wire = this[wireSymbol]) {
		return {
			getDomain: () => new this[domainSymbol](metadata, wire),
			getReadmodels: () => new this[readmodelsSymbol](metadata),
			getCrud: () => new this[crudmodelsSymbol](metadata),
			getServices: () => this[servicesSymbol],
			errors: this[errorsSymbol],
		};
	}
}

module.exports = WireApi;

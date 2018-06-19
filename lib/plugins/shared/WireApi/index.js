'use strict';

const buildDomainClass = require('./buildDomainClass');
const buildReadmodelsClass = require('./buildReadmodelsClass');
const buildCrudmodelsClass = require('./buildCrudmodelsClass');
const {
	crudmodelsSymbol,
	readmodelsSymbol,
	domainSymbol,
	servicesSymbol,
	errorsSymbol,
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
		this[domainSymbol] = buildDomainClass({ app, wire, domain });
		this[readmodelsSymbol] = buildReadmodelsClass({ wire, readmodels });
		this[crudmodelsSymbol] = buildCrudmodelsClass({ wire, crud });
		this[servicesSymbol] = wire.servicesStore.buildBaseApi({ services });
		this[errorsSymbol] = errors;
	}

	get(metadata) {
		return {
			getDomain: () => new this[domainSymbol](metadata),
			getReadmodels: () => new this[readmodelsSymbol](metadata),
			getCrud: () => new this[crudmodelsSymbol](metadata),
			getServices: () => this[servicesSymbol],
			errors: this[errorsSymbol],
		};
	}
}

module.exports = WireApi;

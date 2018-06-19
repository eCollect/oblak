'use strict';

const buildDomainClass = require('./buildDomainClass');
const buildReadmodelsClass = require('./buildReadmodelsClass');
const buildCrudmodelsClass = require('./buildCrudmodelsClass');
const { crudmodelsSymbol, readmodelsSymbol, domainSymbol } = require('./symbols');

class WireApi {
	constructor({
		app,
		wire,
		domain,
		crud,
		readmodels,
	}) {
		this[domainSymbol] = buildDomainClass({ app, wire, domain });
		this[readmodelsSymbol] = buildReadmodelsClass({ wire, readmodels });
		this[crudmodelsSymbol] = buildCrudmodelsClass({ wire, crud });
	}

	get(metadata) {
		return {
			getDomain: () => new this[domainSymbol](metadata),
			getReadmodels: () => new this[readmodelsSymbol](metadata),
			getCrud: () => new this[crudmodelsSymbol](metadata),
		};
	}
}

module.exports = WireApi;

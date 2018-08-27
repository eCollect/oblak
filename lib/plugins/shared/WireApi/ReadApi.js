'use strict';

const buildReadmodelsClass = require('./buildReadmodelsClass');
const buildCrudmodelsClass = require('./buildCrudmodelsClass');

const {
	crudmodelsSymbol,
	readmodelsSymbol,
	servicesSymbol,
	errorsSymbol,
} = require('./symbols');


class WireApi {
	constructor({
		wire,
		crud,
		readmodels,
		services,
		errors,
	}) {
		this[readmodelsSymbol] = buildReadmodelsClass({ wire, readmodels });
		this[crudmodelsSymbol] = buildCrudmodelsClass({ wire, crud });
		this[servicesSymbol] = wire.servicesStore.buildBaseApi({ services });
		this[errorsSymbol] = errors;
		this.name = wire.name;
	}

	get(metadata) {
		return {
			getReadmodels: () => new this[readmodelsSymbol](metadata),
			getCrud: () => new this[crudmodelsSymbol](metadata),
			getServices: () => this[servicesSymbol],
			errors: this[errorsSymbol],
		};
	}
}

module.exports = WireApi;

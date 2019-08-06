'use strict';

const buildReadmodelsClass = require('./buildReadmodelsClass');
const buildCrudmodelsClass = require('./buildCrudmodelsClass');

const {
	crudmodelsSymbol,
	readmodelsSymbol,
	servicesSymbol,
	errorsSymbol,
	wireSymbol,
} = require('./symbols');


class WireApi {
	constructor({
		wire,
		crud,
		readmodels,
		services,
		errors,
	}) {
		this[wireSymbol] = wire;
		this[readmodelsSymbol] = buildReadmodelsClass({ wire, readmodels });
		this[crudmodelsSymbol] = buildCrudmodelsClass({ wire, crud });
		this[servicesSymbol] = wire.servicesStore.buildBaseApi({ services });
		this[errorsSymbol] = errors;
		this.name = wire.name;
	}

	get(metadata, options) {
		return {
			getReadmodels: () => new this[readmodelsSymbol](metadata, options),
			getCrud: () => new this[crudmodelsSymbol](metadata, options),
			getServices: () => this[servicesSymbol],
			getLogger: () => this[wireSymbol].getLogger(),
			errors: this[errorsSymbol],
		};
	}
}

module.exports = WireApi;

'use strict';

module.exports = {
	idSymbol: Symbol('oblak:domain:id'),
	metadataSymbol: Symbol('oblak:domain:metadata'),
	domainSymbol: Symbol('oblak:domain:api'),
	readmodelsSymbol: Symbol('oblak:readmodels:api'),
	crudmodelsSymbol: Symbol('oblak:crudmodels:api'),
	servicesSymbol: Symbol('oblak:api:services'),
	commandRunnerSymbol: Symbol('oblak:domain:commandRunner'),
	errorsSymbol: Symbol('oblak:errors'),
	wireSymbol: Symbol('oblak:wire'),
	eventstoreSymbol: Symbol('oblak:eventstore'),
	loggerSymbol: Symbol('oblak:wire:logger'),
};

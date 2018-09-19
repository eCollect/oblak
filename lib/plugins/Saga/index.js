'use strict';

const SagaService = require('./SagaService');

class Saga {
	constructor({
		name = 'saga',
	} = {}) {
		this.name = name;
	}

	processes({ sagas }) { // eslint-disable-line
		const services = [];
		Object.entries(sagas).forEach(([type, { sagas: subSagas }]) => Object.keys(subSagas).forEach((sagaName) => {
			services.push(new SagaService({ type, sagaName }));
		}));
		return services.filter(Boolean);
		// return Object.keys(sagas).map(sagaName => new SagaService({ sagaName, name: `${this.name}:${sagaName}` })).filter(a => a);
	}
}

module.exports = Saga;

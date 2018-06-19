'use strict';

const SagaService = require('./SagaService');

class Saga {
	constructor({
		name = 'saga',
	} = {}) {
		this.name = name;
	}

	processes({ sagas }) { // eslint-disable-line
		return Object.keys(sagas).map(sagaName => new SagaService({ sagaName, name: `${this.name}:${sagaName}` })).filter(a => a);
	}
}

module.exports = Saga;

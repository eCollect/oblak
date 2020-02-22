'use strict';

const WorkerService = require('./WorkerService/WorkerService.js');

class Workers {
	constructor({
		name = 'worker',
		workerNames = ['.'],
	} = {}) {
		this.name = name;
		this.workerNames = workerNames;
	}

	processes({ workers }) { // eslint-disable-line
		const services = [];
		Object.entries(workers).forEach(([type, workers]) => Object.keys(workers).forEach((workerName) => {
			if (!(this.workerNames.includes('.') || this.workerNames.includes(`${type}:${workerName}`)))
				return;
			services.push(new WorkerService({ type, workerName }));
		}));
		return services;
		// return Object.keys(sagas).map(sagaName => new SagaService({ sagaName, name: `${this.name}:${sagaName}` })).filter(a => a);
	}
}

module.exports = Workers;

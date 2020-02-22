'use strict';

const JobBuilder = require('./JobBuilder');

const { metadataSymbol } = require('./symbols');

const buildTypeClass = ({ wire, type, workers }) => {
	function WorkerGroup(metadata, options) {
		this[metadataSymbol] = metadata;
		this.options = options;
	}

	Object.keys(workers).forEach((workerName) => {
		WorkerGroup.prototype[workerName] = function sendJob(id, payload = {}, metadata = {}) {
			if (!id)
				throw new Error('Jobs are useless without ID.');

			metadata = { ...this[metadataSymbol], ...metadata };
			const { Job } = wire.app;
			const job = new Job({
				id,
				payload,
				envelope: {
					to: `${type}.${workerName}`,
					from: wire.app.processIdentity.id,
				},
			});
			return new JobBuilder({
				app,
				job,
				wire,
			});
		};
	});

	return WorkerGroup;
};

const buildModelsClass = ({ wire, workers: workerGroups }) => {
	function Workers(metadata = {}, options = {}) {
		this[metadataSymbol] = metadata;
		this.options = options;
	}
	Object.entries(workerGroups).forEach(([type, workers]) => {
		const WorkerGroup = buildTypeClass({ wire, type, workers });
		Object.defineProperty(Workers.prototype, type, {
			get() {
				return new WorkerGroup(this[metadataSymbol], this.options);
			},
		});
	});
	return Workers;
};

module.exports = buildModelsClass;

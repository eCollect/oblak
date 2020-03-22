'use strict';

module.exports = class JobBuilder {
	constructor({
		app,
		job,
		wire,
	}) {
		this.job = job;
		this.wire = wire;
		this.app = app;
	}

	notBefore(date) {
		if (!date || Date.isNaN(new Date(date)))
			throw new Error('invalid date.');
		this.job.execution.notBefore = new Date(date);
		return this;
	}

	notAfter(date) {
		if (!date || Date.isNaN(new Date(date)))
			throw new Error('invalid date.');
		this.job.execution.notAfter = new Date(date);
		return this;
	}

	partitionKey(partitionKey) {
		if (!partitionKey)
			throw new Error('Invalid parition key.');
		this.job.execution.partitionKey = partitionKey;
		return this;
	}


	// execution
	catch(reject) {
		return this.exec().catch(reject);
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	exec() {
		return new Promise((res, rej) => this.wire.app.jobbus.outgoing.write(this.job, (err) => {
			if (err)
				return rej(err);
			return res();
		}));
	}
};

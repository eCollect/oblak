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
		if (!date || isNaN(new Date(date)))
			throw new Error('invalid date.');
		this.job.execution.notBefore = new Date(date);
	}

	notAfter(date) {
		if (!date || isNaN(new Date(date)))
			throw new Error('invalid date.');
		this.job.execution.notAfter = new Date(date);
	}

	catch(reject) {
		return this.exec().catch(reject);
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	exec() {
		return new Promise((res, rej) => this.app.jobbus.outgoing.write(this.job, (err) => {
			if (err)
				return rej(err);
			return res();
		}));
	}
};

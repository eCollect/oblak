'use strict';


class JobRunner {
	constructor(app, {
		store,
		apiBuilder,
	}) {
		this.app = app;
		this.store = store;
		this.apiBuilder = apiBuilder;
		this.logger = this.app.services.getLogger();
		this._container = {};
	}

	async init({ path, config }) {
		const {
			setup,
			execute,
			dispose = () => {},
		// eslint-disable-next-line global-require
		} = require(path);

		this._container = await setup(config, this.app) || {};
		// min one stage
		this._execute = JobRunner.normalizeExecute(execute || (() => {}));
		this._stages = this._execute.length - 1;
		this._dispose = dispose;
	}

	async execute(job) {
		let lockedJob = await this._beforeExecution(job);
		if (!lockedJob) {
			this.logger.debug(job, 'Failed to lock, skipping.');
			return;
		}
		try {
			const api = this.apiBuilder();
			const { stage } = lockedJob.state;
			if (stage < this._stages)
				for (let i = stage; i < stage; i++) {
					this._execute(lockedJob, this.container, api);
					lockedJob = await this.store.updateStage(lockedJob, i);
					if (!lockedJob)
						throw new Error('Something went wrong during stages.');
				}
			await this.store.setToDone(lockedJob);
			this.logger.debug(lockedJob, 'Jobed finished successfully.');
		} catch (e) {
			await this.store.setToError(lockedJob, e);
		}
	}

	async _beforeExecution(job) {
		return this.store.lockForProcessing(job);
	}

	static normalizeExecute(execute) {
		if (Array.isArray(execute))
			return execute.flat(Infinity);
		return [execute];
	}
}

module.exports = JobRunner;

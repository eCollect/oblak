'use strict';

const path = require('path');

const { pipeline } = require('stream');

const { OblakTransform } = require('../../shared/streams');
const repositoryOptions = require('../../shared/storeOptions');

const WorkerMongoDbStore = require('oblak/lib/plugins/Workers/lib/stores/JobMongoDbStore.js');
const JobExecutor = require('../lib/JobExecutor.js');
const JobScheduler = require('../lib/JobScheduler.js');

module.exports = class WorkerStream extends OblakTransform {
	constructor(app, oblak, type, workerName) {
		super(app);
		this.Job = app.Job;
		this.Notification = app.Notification;
		this.type = type;
		this.workerName = workerName;
	}

	async init(oblak, wire) {
		// this.eventstore = wire.eventstore;

		const customApiBuilder = (options = {}) => wire.wireApi.get({}, options);

		const repository = repositoryOptions(this.app.config.workers.$scheduler, this.app);
		const store = new WorkerMongoDbStore(this.app, repository);

		this._scheduler = new JobScheduler(this.app, store);
		this._executor = new JobExecutor(this.app, {
			store,
			apiBuilder: customApiBuilder,
		});

		await store.init();

		await this._executor.init(oblak.workers[this.type][this.workerName], this.app.config.workers[this.type][this.workerName]);

		this.logger = this.app.services.getLogger();
	}

	async clear(rebuildIndex = false) {
		return this.denormalizer.clear(rebuildIndex);
	}

	// perfect example for what callback hell looks like.
	async _transform(job, _, next) {
		this.logger.debug(job, 'Received job.');
		next();
		let executionJob;
		try {
			executionJob = await this._scheduler.getOrAddJob(job);
			if (!this._scheduler.shouldJobBeExecuted(executionJob))
				return;
			await this._executor.execute(executionJob);
		} catch (e) {
			this.logger.error(e, executionJob || job, 'Error processing job.');
		} finally {
			job.ack();
		}
	}
};

'use strict';

const EventEmitter = require('events');
const cronParser = require('cron-parser');

const statues = require('./statuses');

const MIN_DATE = new Date('1970-01-01');
const MAX_DATE = new Date('3000-01-01');

/*
_id,
id,
payload = {},
metadata = {},
envelope = {
	to: '', // worker full name ( ie outbound.letter )
	from: '', // process id
	timestamp: new Date(),
},
execution = {
	notBefore: MIN_DATE,
},
state = {
	status: 'new', 'pending', 'processing', 'error', 'done',
	stage: 0,
	lastException: null,
	messages: [],
	runCount: 0,
},
attributes = {},
*/

// { 'envelope.to': 'mitko', 'state.status': 'ds', execution: 'partitionKey': 'null' }

class JobScheduler extends EventEmitter {
	constructor(app, store) {
		super();
		this.app = app;
		this.store = store;
	}

	// eslint-disable-next-line class-methods-use-this
	init() {}

	/**
	 * Executed when a job comes from the bus
	 * @param {*} job
	 */
	async getOrAddJob(job) {
		const {
			id = 'mitko', payload = {}, metadata = {}, envelope, execution,
		} = job;
		if (!id)
			throw new Error('Jobs without id are invalid!');

		const now = new Date();

		const normalizedJob = {
			id,
			payload,
			metadata,
			envelope,
			lastReceivedAt: now,
		};

		const onNew = {
			state: JobScheduler.getPureState(),
			execution: JobScheduler.normalizeExecution(execution),
			createdAt: now,
			lastRunAt: null,
			lastExceptionAt: null,
			doneAt: null,
			duration: null,
		};

		return this.store.getOrAddJob(normalizedJob, onNew);
	}

	// eslint-disable-next-line class-methods-use-this
	shouldJobBeExecuted(job) {
		return job.execution.notBefore.getTime() <= Date.now();
	}

	static getPureState() {
		return {
			status: statues.PENDING,
			stage: 0,
			lastException: null,
			messages: [],
			runCount: 0,
			data: {},
		};
	}

	static normalizeExecution({
		notBefore = MIN_DATE, notAfter = MAX_DATE, partitionKey = null, cron = null,
	} = {}) {
		if (cron)
			({ notBefore } = JobScheduler.parseCron(cron, notBefore));

		const res = {
			notBefore: new Date(notBefore),
			notAfter: new Date(notAfter),
			cron,
		};

		if (partitionKey)
			res.partitionKey = partitionKey;
		return res;
	}

	static parseCron(notBefore = MIN_DATE, { interval = '', tz = null } = {}) {
		if (!interval)
			throw new Error('Cron data misformatted. Interval is missing.');

		const now = Date.now();
		if (notBefore.getTime() < now)
			notBefore = now;

		const options = {
			currentDate: notBefore,
		};

		if (tz)
			options.tz = tz;
		const cronExpression = cronParser.parseExpression(interval, options);
		return {
			notBefore: cronExpression.next().toDate(),
		};
	}
}

module.exports = JobScheduler;

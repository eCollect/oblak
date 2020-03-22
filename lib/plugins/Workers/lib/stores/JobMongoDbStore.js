'use strict';

const EventEmitter = require('events');

const serializeError = require('../../../../utils/serializeError');

const statuses = require('../statuses');


class WorkerMongoDbStore extends EventEmitter {
	constructor(app, repository) {
		super();
		this.app = app;
		this.repository = repository;
		this.db = null;
		this.collection = null;
	}

	async init() {
		const mongoClient = await this.app.connections.get('mongodb');
		this.db = mongoClient.db(this.repository.dbName);
		this.collection = this.db.collection(this.repository.collectionName);

		// id index
		await this.collection.createIndex({
			id: 1,
			'state.status': 1,
		}, {
			unique: true,
			name: 'job_status_id',
		});

		// partitionKey constrains creation
		await this.collection.createIndex({
			'envelope.to': 1,
			'state.status': 1,
			'execution.partitionKey': 1,
		}, {
			partialFilterExpression: {
				$and: [
					{ 'state.status': statuses.PROCESSING },
					{ 'execution.partitionKey': { $exists: true } },
				],
			},
			unique: true,
			name: 'unique_partition',
		});

		return this;
	}

	async getOrAddJob(job, onNew) {
		const { value } = await this.collection.findOneAndUpdate({
			id: job.id,
		}, {
			$set: job,
			$setOnInsert: onNew,
		}, {
			upsert: true,
			returnOriginal: false,
		});
		return value;
	}

	async getNextPartitionedJob(worker) {
		const cursour = this.collection.find({
			'envelope.to': worker,
			'state.status': { $in: [statuses.ERROR, statuses.PENDING, statuses.PROCESSING] },
			'execution.notBefore': { $gte: new Date() },
		}).sort({
			createdAt: -1,
		});
		let nextJob;
		const locked = {};
		for await(const job of cursour) {
			if (locked[job.exception.partitionKey])
				continue;
			if (job.state.status === statuses.ERROR || job.state.statuses.PROCESSING) {
				locked[job.exception.partitionKey] = true;
				continue;
			}
			nextJob = job;
			break;
		}
		await cursour.close().catch();
		return nextJob;
	}

	async lockForProcessing(job) {
		const { value } = await this.collection.findOneAndUpdate({
			id: job.id,
			'state.status': { $in: [statuses.ERROR, statuses.PENDING] },
		}, {
			$set: { 'state.status': statuses.PROCESSING },
			$inc: { runCount: 1 },
			$currentDate: { lastRunAt: true },
		}, {
			returnOriginal: false,
		});
		return value;
	}

	async setToDone(job) {
		return this.collection.findOneAndUpdate({
			id: job.id,
			'state.status': statuses.PROCESSING,
		}, {
			$set: {
				'state.status': statuses.DONE,
				'state.data': job.state.data || {},
				duration: Date.now() - job.lastRunAt.getTime(),
			},
		}, {
			returnOriginal: false,
		});
	}

	async setToError(job, exception) {
		await this.collection.findOneAndUpdate({
			id: job.id,
			'state.status': statuses.PROCESSING,
		}, {
			$set: {
				'state.status': statuses.ERROR,
				'state.data': job.state.data || {},
				'state.lastException': serializeError(exception),
				duration: Date.now() - job.lastRunAt.getTime(),
			},
			$currentDate: { lastExecptionAt: true },
		}, {
			returnOriginal: false,
		});
	}

	async updateStage(job, newStage) {
		const { value } = await this.collection.findOneAndUpdate({
			id: job.id,
			'state.status': statuses.PROCESSING,
			'state.stage': job.state.stage,
		}, {
			$set: {
				'state.stage': newStage,
				'state.data': job.state.data || {},
			},
		}, {
			returnOriginal: false,
		});
		return value;
	}
}

module.exports = WorkerMongoDbStore;

'use strict';

const EventEmitter = require('events');

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
			'id': 1,
			'state.status': 1,
		}, {
			unique: true,
			name: 'job_status_id'
		});

		// partitionKey constrains creation
		await this.collection.createIndex({
			'envelope.to': 1,
			'state.status': 1,
			'execution.partitionKey': 1,
		}, {
			partialFilterExpression: {
				$and: [
					{'state.status': statuses.PROCESSING },
					{'execution.partitionKey': { $exists: true } },
				],
			},
			unique: true,
			name: 'unique_partition'
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

	async lockForProcessing(job) {
		const { value } = await this.collection.findOneAndUpdate({
			id: job.id,
			'state.status': {$in: [statuses.ERROR, statuses.PENDING]}
		}, {
			$set: { 'state.status': statuses.PROCESSING },
			$inc: { 'runCount': 1 },
			$currentDate: { lastRunAt: true },
		}, {
			returnOriginal: false,
		});
		return value;
	}

	async setToDone(job) {
		return await this.collection.findOneAndUpdate({
			id: job.id,
			'state.status': statuses.PROCESSING,
		}, {
			$set: {
				'state.status': statuses.DONE,
				'duration': Date.now() - job.lastRunAt.getTime(),
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
				'state.lastException' : exception,
				'duration': Date.now - job.lastRunAt.getTime(),
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
				'state.stage': stage,
			},
		}, {
			returnOriginal: false,
		});
		return value;
	}
}

module.exports = WorkerMongoDbStore;

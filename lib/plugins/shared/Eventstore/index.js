'use strict';

const repositoryOptions = require('../storeOptions');

const EventstoreImportStream = require('./EventstoreImportStream');

const ensureIndexes = async (collection, { indexes }) => {
	for (const index of indexes)
		await collection.createIndex(index);
};

const dontThrowIfNotExsists = (err) => {
	if (err.message.match(/ns not found/))
		return;
	throw err;
};

module.exports = class EventstoreStore {
	constructor(app, wire) {
		this.app = app;
		this.wire = wire;
		this.db = null;
		this.collection = null;
		this.positionsCollection = null;
	}

	async init() {
		const mongoClient = await this.app.connections.get('mongodb');
		const { eventsCollectionName, dbName } = repositoryOptions(this.app.config.eventStore, this.app);
		this.db = mongoClient.db(dbName);

		this.positionsCounterId = eventsCollectionName;

		this.collection = this.db.collection(eventsCollectionName);
		this.positionsCollection = this.db.collection('positions');
		this.snapshotsCollection = this.db.collection('snapshots');

		// create positon index
		await this.collection.createIndex({
			position: 1, commitStamp: 1, streamRevision: 1, commitSequence: 1,
		});
		await ensureIndexes(this.collection, this.app.config.eventStore);
		return this;
	}

	readForAggregates(aggregateIds = [], direction = 'asc') {
		return this.collection.find({ aggregateId: { $in: aggregateIds } }).sort([['commitStamp', direction], ['streamRevision', direction], ['commitSequence', direction]]);
	}

	query(find, direction = 'asc') {
		return this.collection.find(find).sort([['position', direction], ['commitStamp', direction], ['streamRevision', direction], ['commitSequence', direction]]);
	}

	getReplay({ fromPosition = 1, toPosition } = {}) {
		if (toPosition && fromPosition > toPosition)
			throw new Error('From position is greater than to position.');

		const positionQuery = { $gte: fromPosition };
		if (toPosition)
			positionQuery.$lte = toPosition;

		return this.collection.find({
			position: positionQuery,
		}).sort({
			position: 1, commitStamp: 1, streamRevision: 1, commitSequence: 1,
		});
	}

	async getLastPosition() {
		const [lastEvent] = await this.collection.find().sort({ position: -1 }).limit(1).toArray();

		if (lastEvent)
			return lastEvent.position;

		return 0;
	}

	getImportStream() {
		return new EventstoreImportStream(this);
	}

	getExportStream() {
		return this.getReplay();
		// return new EventstoreExportStream(this.collection, this.positionsCollection, this.snapshotsCollection);
	}

	async clear() {
		Promise.all([
			this.collection.drop().catch(dontThrowIfNotExsists),
			this.snapshotsCollection.drop().catch(dontThrowIfNotExsists),
			this.positionsCollection.drop().catch(dontThrowIfNotExsists),
		]);
	}
};

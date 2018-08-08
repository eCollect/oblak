'use strict';

const repositoryOptions = require('../storeOptions');

module.exports = class ReadmodelsStore {
	constructor(app, wire) {
		this.app = app;
		this.wire = wire;
		this.db = null;
		this.collection = null;
	}

	async init() {
		const mongoClient = await this.app.connections.get('mongodb');
		const { eventsCollectionName, dbName } = repositoryOptions(this.app.config.eventStore, this.app);
		this.db = mongoClient.db(dbName);
		this.collection = this.db.collection(eventsCollectionName);
		return this;
	}

	readForAggregates(aggregateIds = [], direction = 'asc') {
		return this.collection.find({ aggregateId: { $in: aggregateIds }}).sort([['commitStamp', direction], ['streamRevision', direction], ['commitSequence', direction]]);
	}
};

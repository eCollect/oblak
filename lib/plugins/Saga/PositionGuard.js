'use strict';

class PositionGuard {
	constructor(app) {
		this.db = null;
		this.collection = null;
	}

	async init(app, repository) {
		const mongoClient = await app.connections.get('mongodb');
		this.db = mongoClient.db(repository.dbName);
		this.collection = this.db.collection(repository.collectionName);
	}

	async check(group, { position }) {
		const currentPosition = await this.collection.findOne({ _id: group });
		return currentPosition ? currentPosition.position : null;
	}

	async update(group, { position }) {
		if (!position)
			return;
		await this.collection.findOneAndUpdate({ _id: group }, { $set: { position }}, { upsert:true, returnOriginal: false })
	}
}

module.exports = PositionGuard;

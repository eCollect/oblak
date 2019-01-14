'use strict';

const { Writable } = require('stream');

const isStoreEmpty = async function isStoreEmpty(store) {
	const [event] = await store.collection.find({}).limit(1).toArray();

	if (!event)
		return true;
	return false;
};

const persistPositions = async function persistPositions(store) {
	const lastPosition = await store.getLastPosition();
	if (!lastPosition)
		return;

	await store.positionsCollection.findOneAndUpdate({ _id: store.positionsCounterId }, { $set: { position: lastPosition } }, { returnOriginal: false, upsert: true });
};

class EventstoreImportStream extends Writable {
	constructor(store, { batchSize = 500, cleanStore = false } = {}) {
		super({ objectMode: true });
		this.store = store;
		this.cleanStore = cleanStore;
		this.batchSize = batchSize;
		this.records = [];

		this.counter = 0;

		this.isFirst = true;
	}

	async _write(record, _, next) {
		try {
			if (this.isFirst && !await isStoreEmpty(this.store))
				throw new Error('Eventstore not empty - import not possible.');

			this.isFirst = false;

			this.records.push(record);
			if (this.records.length >= this.batchSize)
				await this._insert();
			next();
		} catch (e) {
			next(e);
		}
	}

	async _final(next) {
		try {
			if (this.records.length)
				await this._insert();
			await persistPositions(this.store);
			next();
		} catch (e) {
			next(e);
		}
	}

	async _insert() {
		await this.store.collection.insertMany(this.records, { w: 1 });
		this.counter += this.records.length;
		this.records = [];
	}
}

module.exports = EventstoreImportStream;

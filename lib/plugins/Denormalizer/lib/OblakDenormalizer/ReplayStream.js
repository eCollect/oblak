'use strict';

const { Writable } = require('stream');

const ModelStore = require('./ModelStore');

module.exports = class ReplayStream extends Writable {
	constructor(denormalizer, collections, { emitter } = {}) {
		super({ objectMode: true });
		this._denormalizer = denormalizer;
		this._collections = collections;
		this._emitter = emitter;
		this._counter = 0;

		this._modelStore = new ModelStore({
			dbModelStore: this._denormalizer.modelStore,
			type: this._denormalizer.type,
		});

		this._stats = {};
		this._started = Date.now();
		this._stats.all = {
			count: 0,
			max: 0,
			avg: 0,
			took: 0,
		};
	}

	async _write({ payload: evt }, _, next) {
		const now = Date.now();
		evt.fullname = `domain.${evt.context}.${evt.aggregate.name}.${evt.name}`;
		const { error } = await this._denormalizer.replay(evt, this._collections, this._modelStore);
		this._counter += 1;
		this._writeStats(evt, Date.now() - now);

		if (this._emitter)
			this._emitter.progress(this._counter);
			// this._progress.update(this._counter);

		next(error);
	}

	_writeStats({ fullname }, took) {
		this._stats.all = {
			count: this._counter,
			max: Math.max(took, this._stats.all.max),
			avg: ((this._stats.all.avg * (this._counter.count - 1)) + took) / this._counter,
		};


		this._stats[fullname] =	this._stats[fullname] || {
			count: 0,
			max: 0,
			avg: 0,
		};

		const stats = this._stats[fullname];
		stats.count += 1;
		stats.max = Math.max(took, stats.max);
		stats.avg = ((stats.avg * (stats.count - 1)) + took) / stats.count;
	}

	async _final(next) {
		await this._modelStore.flush(true);
		this._stats.all.took = Date.now() - this._started;
		next();
	}

	getStats() {
		return this._stats;
	}
};

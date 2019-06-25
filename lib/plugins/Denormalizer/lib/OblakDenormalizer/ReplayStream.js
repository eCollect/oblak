'use strict';

const { Writable } = require('stream');

module.exports = class ReplayStream extends Writable {
	constructor(denormalizer, collections, { progress } = {}) {
		super({ objectMode: true });
		this._denormalizer = denormalizer;
		this._collections = collections;
		this._progress = progress;
		this._counter = 0;

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
		const { error } = await this._denormalizer.replay(evt, this._collections);
		this._counter += 1;
		this._writeStats(evt, Date.now() - now);

		if (this._progress)
			this._progress.update(this._counter);

		next(error);
	}

	_writeStats({ fullname }, took) {
		this._stats.all = {
			count: this._counter,
			max: Math.max(took, this.stats.all.max),
			avg: ((this.stats.all.avg * (this._counter.count - 1)) + took) / this._counter,
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

	_final(next) {
		this.stats.all.took = Date.now() - this._started;
		next();
	}

	getStats() {
		return this._stats;
	}
};

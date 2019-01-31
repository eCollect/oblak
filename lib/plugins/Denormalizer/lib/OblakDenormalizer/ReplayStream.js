'use strict';

const { Writable } = require('stream');

module.exports = class ReplayStream extends Writable {
	constructor(denormalizer, collections, { progress } = {}) {
		super({ objectMode: true });
		this._denormalizer = denormalizer;
		this._collections = collections;
		this._progress = progress;
		this._counter = 0;
	}

	async _write({ payload: evt }, _, next) {
		evt.fullname = `domain.${evt.context}.${evt.aggregate.name}.${evt.name}`;
		const { error } = await this._denormalizer.replay(evt, this._collections);
		this._counter += 1;

		if (this._progress)
			this._progress.update(this._counter);

		next(error);
	}
};

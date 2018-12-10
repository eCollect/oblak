'use strict';

const { Writable } = require('stream');

module.exports = class ReplayStream extends Writable {
	constructor(denormalizer, collections) {
		super({ objectMode: true });
		this._denormalizer = denormalizer;
		this._collections = collections;
	}

	async _write({ payload: evt }, _, next) {
		evt.fullname = `domain.${evt.context}.${evt.aggregate.name}.${evt.name}`;
		const { error } = await this._denormalizer.replay(evt, this._collections);
		next(error);
	}
};

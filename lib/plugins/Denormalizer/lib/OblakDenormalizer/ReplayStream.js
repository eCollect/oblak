'use strict';

const { Writable } = require('stream');

module.exports = class ReplayStream extends Writable {
	constructor(denormalizer) {
		super({ objectMode: true });
		this._denormalizer = denormalizer;
	}

	async _write({ payload: evt }, _, next) {
		evt.fullname = `domain.${evt.context}.${evt.aggregate.name}.${evt.name}`;
		const { error } = await this._denormalizer.handle(evt, true);
		next(error);
	}
};

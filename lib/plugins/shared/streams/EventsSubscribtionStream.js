'use strict';

const { Transform } = require('stream');

const partOf = require('../partOf');


module.exports = class EventSubscribtionStream extends Transform {
	constructor(where) {
		super({ objectMode: true });
		this.where = where;
	}

	_transform(event, _, next) {
		if (event.type === 'denormalized')
			return next();
		if (!partOf(this.where, event))
			return next();

		next(null, event);
	}
}

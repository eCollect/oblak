'use strict';

const { Transform } = require('stream');

class MapHitStream extends Transform {
	constructor() {
		super({ objectMode: true });
	}

	_transform(obj, _, next) { // eslint-disable-line
		if (!('_source' in obj))
			return next(null, obj);
		obj._source._id = obj._id;
		return next(null, obj._source);
	}
}

module.exports = MapHitStream

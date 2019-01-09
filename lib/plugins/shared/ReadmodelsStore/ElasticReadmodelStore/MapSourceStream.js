'use strict';

const { Transform } = require('stream');

class MapHitStream extends Transform {
	constructor() {
		super({ objectMode: true });
	}

	_transform(obj, _, next) { // eslint-disable-line
		if (!obj || !('_source' in obj))
			return next(null);
		obj._source._id = obj._id;
		obj._source.version = obj._version;
		// obj._source.inner_hits = mapInnerHits(obj.inner_hits);
		return next(null, obj._source);
	}
}

module.exports = MapHitStream;

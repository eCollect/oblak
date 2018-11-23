'use strict';

const { Transform } = require('stream');

const mapHit = (obj) => {
	if (!obj || !('_source' in obj))
		return obj;
	obj._source._id = obj._id;
	return obj._source;
};

const mapInnerHits = (innerHits) => {
	if (!innerHits)
		return undefined;
	return Object.entries(innerHits).reduce((acc, [key, obj]) => {
		acc[key] = obj.hits.hits.map(mapHit);
		return acc;
	}, {});
};

class MapHitStream extends Transform {
	constructor() {
		super({ objectMode: true });
	}

	_transform(obj, _, next) { // eslint-disable-line
		if (!obj || !('_source' in obj))
			return next(null, obj);

		obj._source._id = obj._id;
		obj._source.inner_hits = mapInnerHits(obj.inner_hits);
		return next(null, obj._source);
	}
}

module.exports = MapHitStream;

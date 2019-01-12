'use strict';

const { default: stringify } = require('fast-stringify');

const { promisify } = require('util');
const { pipeline, Transform } = require('stream');

const asnycPipeline = promisify(pipeline);

class JsonStringify extends Transform {
	constructor() {
		super({ objectMode: true });
		this.isFirst = true;
	}

	_transform(obj, _, next) {
		if (!this.isFirst)
			return next(null, `,${stringify(obj)}`);
		this.isFirst = false;
		return next(null, `[${stringify(obj)}`);
	}

	_final(next) {
		this.push(']');
		next();
	}
}

module.exports = {
	pipeline: asnycPipeline,
	JsonStringify,
};

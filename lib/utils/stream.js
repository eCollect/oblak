'use strict';

const { default: stringify } = require('fast-stringify');

const { promisify } = require('util');
const { pipeline, Transform } = require('stream');

const asnycPipeline = promisify(pipeline);

class JSONLinesStringify extends Transform {
	constructor({ newLine = '\n' } = {}) {
		super({ objectMode: true });
		this.newLine = newLine;
	}

	_transform(obj, _, next) {
		this.push(stringify(obj));
		this.push(this.newLine);
		return next();
	}
}

class JSONLinesParse extends Transform {
	constructor({ newLine = '\n' } = {}) {
		super({ objectMode: true });
		this.newLine = newLine;
		this._lastLineData = '';
	}

	_transform(chunk, _, next) {
		const data = this._lastLineData + chunk.toString('utf8');

		const splitLines = data.split(this.newLine);
		const splitLinesLen = splitLines.length - 1;
		splitLines.forEach((line, index) => {
			this._lastLineData = line;
			if (splitLinesLen !== index)
				this.push(JSON.parse(line));
		});
		next();
	}

	_flush(next) {
		if (this._lastLineData)
			this.push(JSON.parse(this._lastLineData));
		next();
	}
}

class CounterStream extends Transform {
	constructor() {
		super({ objectMode: true });
		this.counter = 0;
	}

	_transform(obj, _, next) {
		this.counter += 1;
		next(null, obj);
	}
}

module.exports = {
	pipeline: asnycPipeline,
	JSONLinesStringify,
	JSONLinesParse,
	CounterStream,
};

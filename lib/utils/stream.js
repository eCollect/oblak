'use strict';

const { default: stringify } = require('fast-stringify');

const { promisify } = require('util');
const {
	pipeline,
	Transform,
	Writable,
	PassThrough,
	Readable,
} = require('stream');

const { EJSON } = require('bson');
const crypto = require('crypto');

const ENCRYPT_ALGORITHM = 'aes-256-ctr';

const asnycPipeline = promisify(pipeline);

const getEncryptStream = (password) => {
	if (!password)
		return new PassThrough();
	return crypto.createCipheriv(ENCRYPT_ALGORITHM, password);
};

const getDecryptStream = (password) => {
	if (!password)
		return new PassThrough();
	return crypto.createDecipheriv(ENCRYPT_ALGORITHM, password);
};

class ReadableObservableStream extends Readable {
	constructor(
		{ source, filter = () => true },
		options,
	) {
		if (!source[Symbol.iterator])
			throw new Error('source must be iteratorable.');

		super(options);

		this._source = source;
		this._filter = filter;
	}

	_read() {
		if (!this.iter)
			this.iter = this._source[Symbol.iterator]();

		let r = this.iter.next();
		while (!r.done && this._pushIfNeeded(r.value))
			r = this.iter.next();

		if (r.done) {
			// since it is possible for r.value to have something meaningful, we must check.
			if (r.value !== null && r.value !== undefined)
				this.push(r.value);

			this.push(null);
		}
	}

	_pushIfNeeded(value) {
		if (!this._filter(value))
			return true;
		return this.push(value);
	}
}

class FilterStream extends Transform {
	constructor(filterFn, options) {
		super(options);

		this.filterFn = filterFn;
	}

	_transform(obj, env, next) {
		if (this.filterFn(obj))
			return this.push(obj);
		next(null);
	}
}

class StatsStream extends Transform {
	finalize(stats) {
		this.push(JSON.stringify(stats));
		this.end();
	}
}

class EJSONLinesStringify extends Transform {
	constructor({ newLine = '\n' } = {}) {
		super({ objectMode: true });
		this.newLine = newLine;
	}

	_transform(obj, _, next) {
		this.push(EJSON.stringify(obj));
		this.push(this.newLine);
		return next();
	}
}

class EJSONLinesParse extends Transform {
	constructor({ newLine = '\n', parser } = {}) {
		super({ objectMode: true });
		this.newLine = newLine;
		this.parser = parser;
		this._lastLineData = '';
	}

	_transform(chunk, _, next) {
		const data = this._lastLineData + chunk.toString('utf8');

		const splitLines = data.split(this.newLine);
		const splitLinesLen = splitLines.length - 1;
		splitLines.forEach((line, index) => {
			this._lastLineData = line;
			if (splitLinesLen !== index)
				this.push(this._parse(line));
		});
		next();
	}

	_flush(next) {
		if (this._lastLineData)
			this.push(this._parse(this._lastLineData));
		next();
	}

	// eslint-disable-next-line class-methods-use-this
	_parse(obj) {
		return EJSON.parse(obj);
	}
}

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
	constructor({ newLine = '\n', parser } = {}) {
		super({ objectMode: true });
		this.newLine = newLine;
		this.parser = parser;
		this._lastLineData = '';
	}

	_transform(chunk, _, next) {
		const data = this._lastLineData + chunk.toString('utf8');

		const splitLines = data.split(this.newLine);
		const splitLinesLen = splitLines.length - 1;
		splitLines.forEach((line, index) => {
			this._lastLineData = line;
			if (splitLinesLen !== index)
				this.push(this._parse(line));
		});
		next();
	}

	_flush(next) {
		if (this._lastLineData)
			this.push(this._parse(this._lastLineData));
		next();
	}

	_parse(obj) {
		return JSON.parse(obj, this.parser);
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

const isCollectionEmpty = async function isCollectionEmpty(collection) {
	const [event] = await collection.find({}).limit(1).toArray();

	if (!event)
		return true;
	return false;
};

class DocumentsImportStream extends Writable {
	constructor(collection, { batchSize = 500, cleanStore = false } = {}) {
		super({ objectMode: true });
		this.collection = collection;
		this.cleanStore = cleanStore;
		this.batchSize = batchSize;
		this.records = [];

		this.counter = 0;

		this.isFirst = true;
	}

	async _write(record, _, next) {
		try {
			if (this.isFirst && !await isCollectionEmpty(this.collection))
				throw new Error('Collection not empty - import not possible.');

			this.isFirst = false;

			this.records.push(record);
			if (this.records.length >= this.batchSize)
				await this._insert();
			next();
		} catch (e) {
			next(e);
		}
	}

	async _final(next) {
		try {
			if (this.records.length)
				await this._insert();
			next();
		} catch (e) {
			next(e);
		}
	}

	async _insert() {
		await this.collection.insertMany(this.records, { w: 1 });
		this.counter += this.records.length;
		this.records = [];
	}
}


module.exports = {
	pipeline: asnycPipeline,
	JSONLinesStringify,
	JSONLinesParse,
	CounterStream,
	EJSONLinesStringify,
	EJSONLinesParse,
	StatsStream,
	DocumentsImportStream,
	getEncryptStream,
	getDecryptStream,
	ReadableObservableStream,
	FilterStream,
};

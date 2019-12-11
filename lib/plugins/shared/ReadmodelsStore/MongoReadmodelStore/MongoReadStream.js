'use strict';

const { Readable } = require('stream');

class MongoReadableStream extends Readable {
	constructor(cursor) {
		super({ objectMode: true });
		this.cursor = cursor;
		this.total = -1;
	}

	_read() {
		if (this.total === -1)
			return this._fetchFirst();

		return this.cursor.hasNext().then((has) => {
			if (has)
				return this.cursor.next().then(data => this.push(data), e => this.destroy(e));
			return this.push(null);
		}, e => this.destroy(e));
	}

	_fetchFirst() {
		this.cursor.count().then((total) => {
			this.total = total;
			this.push({ total });
		}, e => this.destroy(e));
	}

	_destroy(error, next) {
		this._next = false;
		if (!this.cursor.isClosed())
			return this.cursor.close().then(() => next(error), next);
		return next(error);
	}
}

module.exports = MongoReadableStream;

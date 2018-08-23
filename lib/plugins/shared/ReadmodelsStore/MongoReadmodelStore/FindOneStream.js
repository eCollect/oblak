'use strict';

const { Readable } = require('stream');

class FindOneStream extends Readable {
	constructor(cursor) {
		super({ objectMode: true });
		this.cursor = cursor;
		this.next = true;
	}

	_read() {
		if (!this.next)
			return this.push(null);
		this.next = false;
		return this.cursor.then(d => this.push(d), e => this.emit(e));
	}
}

module.exports = FindOneStream;

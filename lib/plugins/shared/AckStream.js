'use strict';

const { Transform } = require('stream');

module.exports = class AckStream extends Transform {
	constructor() {
		super({ objectMode: true });
	}

	_write(msg, _, done) {
		msg.ack();
		this.push(msg);
		done(null);
	}
};

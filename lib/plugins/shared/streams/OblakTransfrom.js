'use strict';

const { Transform } = require('stream');

module.exports = class OblakTransform extends Transform {
	constructor(app) {
		super({ objectMode: true });
		this.app = app;
		this.on('error', e => this.app.fail(e));
		this.on('disconnect', e => this.app.fail(e));
	}
};

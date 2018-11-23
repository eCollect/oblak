'use strict';

const merge = require('lodash.merge');

const PayloadBuilder = require('./PayloadBuilder');

module.exports = class MongoPayloadBuilder extends PayloadBuilder {
	constructor() {
		super();
		this._payload = {};
	}

	set(field, value) {
		merge(this._payload, { $set: { [field]: value } });
	}

	plus(field, value) {
		merge(this._payload, { $inc: { [field]: value } });
	}

	minus(field, value) {
		merge(this._payload, { $inc: { [field]: -value } });
	}

	multiplyBy(field, value) {
		merge(this._payload, { $mul: { [field]: value } });
	}

	divideBy(field, value) {
		merge(this._payload, { $mul: { [field]: (1 / value) } });
	}

	build() {
		return this._payload;
	}
};

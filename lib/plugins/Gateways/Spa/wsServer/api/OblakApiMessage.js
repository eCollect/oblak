'use strict';

const uuid = require('uuid/v4');

module.exports = class OblakApiMessage {
	constructor({
		type,
		version = 'v1',
		correlationId = uuid(),
		statusCode = 200,
		payload = {},
	}) {
		this.type = type;
		this.version = version;
		this.statusCode = statusCode;
		this.correlationId = correlationId;
		this.payload = payload;
	}

	setPayload(payload) {
		this.payload = payload;
		return this;
	}
};

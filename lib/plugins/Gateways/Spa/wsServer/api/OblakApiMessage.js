'use strict';

module.exports = class OblakApiMessage {
	constructor({
		type,
		version = 'v1',
		correlationId = uuid(),
		payload = {},
	}) {
		this.type = type;
		this.version = version;
		this.correlationId = correlationId;
		this.payload = payload;
	}

	setPayload(payload) {
		this.payload = payload;
	}
}

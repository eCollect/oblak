'use strict';

const OblakError = require('../../../../../tools/errors/OblakError');

module.exports = class ConcurrencyError extends OblakError {
	constructor({ type, collection }, domainEvent) {
		super(`[readmodels.${type}|${domainEvent.fullname}|${domainEvent.id}|${domainEvent.metadata.position}] Concurrency Error`, 400, false);
		this.data = {
			readmodel: {
				type,
				collection,
			},
			event: {
				fullname: domainEvent.fullname,
				id: domainEvent.id,
				position: domainEvent.metadata.position,
			},
		};
	}

	static fromContext({ type, domainEvent }, { name }) {
		return new ConcurrencyError({ type, collection: name }, domainEvent);
	}
}

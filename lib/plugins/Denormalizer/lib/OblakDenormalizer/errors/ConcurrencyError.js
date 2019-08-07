'use strict';

const OblakError = require('../../../../../tools/errors/OblakError');

module.exports = class ConcurrencyError extends OblakError {
	constructor({ type, collection }, domainEvent) {
		const message = domainEvent
			? `[readmodels.${type}|${domainEvent.fullname}|${domainEvent.id}|${domainEvent.metadata.position}] Concurrency Error`
			: `[readmodels.${type}] Concurrency Error`;
		super(message, 400, false);

		this.data = {
			readmodel: {
				type,
				collection,
			},
		};

		if (domainEvent)
			this.data.event = {
				fullname: domainEvent.fullname,
				id: domainEvent.id,
				position: domainEvent.metadata.position,
			};
	}

	static fromContext({ type, domainEvent }, { name }) {
		return new ConcurrencyError({ type, collection: name }, domainEvent);
	}

	static fromReply({ type, collection }) {
		return new ConcurrencyError({ type, collection });
	}
};

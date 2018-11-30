'use strict';

const CombinedError = require('./errors/CombinedError');

module.exports = class HandleContext {
	constructor(
		domainEvent,
		{
			callbacks,
			type,
		},
		{
			isReplay = false,
		}
	) {
		this.domainEvent = domainEvent;
		this.isReplay = isReplay;
		this.type = type;
		this.currentEventData = {
			id: domainEvent.id,
			position: domainEvent.metadata.position,
		};
		this.callbacks = callbacks;
		this.notifications = [];
		this.errors = [];
	}

	notify(notification) {
		if (this.isReplay)
			return;

		this.callbacks.notification(notification);
		this.notifications.push(notification);
	}

	error(error) {
		this.errors.push(error);
	}

	getError() {
		if (!this.errors.length)
			return null;
		if (this.errors.length === 1)
			return this.errors[0];
		return new CombinedError('Multiple denomralization errors', this.errors);
	}
};

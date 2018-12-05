'use strict';

const CombinedError = require('./errors/CombinedError');

const generateNotification = (
	{ domainEvent, type },
	{
		operation, collection, id, payload,
	},
) => ({
	...domainEvent.serialize(),
	type: 'readmodel',
	name: operation,
	payload,
	readmodel: {
		collection,
		type,
		id,
	},
	event: {
		name: domainEvent.name,
		id: domainEvent.id,
	},
});
module.exports = class HandleContext {
	constructor(
		domainEvent,
		{
			callbacks,
			type,
		},
		{
			isReplay = false,
		},
	) {
		this.domainEvent = domainEvent;
		this.isReplay = isReplay;
		this.type = type;
		this.currentEventData = {
			id: domainEvent.id,
			position: domainEvent.metadata.position,
		};
		this.hasPersistance = domainEvent.metadata.position !== undefined;
		this.callbacks = callbacks;
		this.notifications = [];
		this.errors = [];
	}

	notify(notification) {
		if (this.isReplay)
			return;

		notification = generateNotification(notification);

		this.callbacks.notification(notification);
		this.notifications.push(notification);
	}

	error(error) {
		this.errors.push(error);
	}

	isAlreadyDenormalized({ position }) {
		return this.hasPersistance && position >= this.currentEventData.position;
	}

	getError() {
		if (!this.errors.length)
			return null;
		if (this.errors.length === 1)
			return this.errors[0];
		return new CombinedError('Multiple denomralization errors', this.errors);
	}
};

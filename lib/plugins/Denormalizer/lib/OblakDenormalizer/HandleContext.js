'use strict';

const CombinedError = require('./errors/CombinedError');

const generateNotification = (
	{ domainEvent, type },
	{
		operation, collection, id, payload,
	},
) => ({
	...domainEvent.serialize(),
	id: undefined,
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
			buffer = [],
		},
	) {
		this.domainEvent = domainEvent;
		this.isReplay = isReplay;
		this.type = type;
		this.currentEventData = {
			id: domainEvent.id,
			position: domainEvent.metadata.position,
		};
		this.buffer = buffer;
		this.hasPersistance = domainEvent.metadata.position !== undefined;
		this.callbacks = callbacks;
		this.notifications = [];
		this.errors = [];
	}

	notify(notification) {
		if (this.isReplay)
			return;

		notification = generateNotification(this, notification);

		this.callbacks.notification(notification);
		this.notifications.push(notification);
	}

	error(error) {
		this.errors.push(error);
	}

	positionDelta({ position }) {
		if (this.hasPersistance)
			return 1;
		return this.currentEventData.position - position;
	}

	getError() {
		return CombinedError.combine(this.errors);
	}
};

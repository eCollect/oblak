'use strict';

const partOf = (subset, superset) => {
	if (typeof subset !== 'object' || typeof superset !== 'object' || (Boolean(subset) && !superset))
		return false;

	return Object.keys(subset).every((key) => {
		const subsetValue = subset[key];
		const supersetValue = superset[key];

		if (typeof supersetValue === 'object' && supersetValue !== null && subsetValue !== null)
			return partOf(subsetValue, supersetValue);
		return subsetValue === supersetValue;
	});
};

module.exports = class Events {
	constructor(app) {
		this.kellner = app.kellner;
		this.app = app;
	}

	observe(where = {}) {
		const { incoming } = this.kellner.eventbus;

		const callbacks = {
			failed(err) {
				throw err;
			},
			started() {},
			received() {},
		};

		// TODO - finish this
		const processEvent = (event) => {
			if (!partOf(where, event))
				return null;
			return null;
		};

		process.nextTick(() => {
			incoming.on('data', processEvent);
		});
	}
};

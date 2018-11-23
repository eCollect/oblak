'use strict';

class EventSequencer {
	constructor() {
		this.models = {};
	}

	registerModel({ name, type, lastProcessedPosition }) {
		if (!name)
			throw new Error('Name is missing.');

		if (!type)
			throw new Error('Type is missing.');

		if (typeof lastProcessedPosition !== 'number')
			throw new Error('Last processed position is missing.');


		this.models[type] = this.models[type] || {};

		if (this.models[type][name])
			throw new Error('Model had already been registered.');


		this.models[type][name] = {
			lastProcessedPosition,
		};
	}

	updatePosition({ name, type, position }) {
		if (!name)
			throw new Error('Name is missing.');

		if (!type)
			throw new Error('Type is missing.');

		if (typeof position !== 'number')
			throw new Error('Position is missing.');


		if (!this.models[type])
			throw new Error('Model type does not exist.');

		if (!this.models[type][name])
			throw new Error('Model name does not exist.');


		const model = this.models[type][name];

		if (position <= model.lastProcessedPosition)
			return;

		model.lastProcessedPosition = position;
	}

	getLowestProcessedPosition() {
		let lowestProcessedPosition;

		Object.keys(this.models).forEach((type) => {
			Object.keys(this.models[type]).forEach((name) => {
				const currentPosition = this.models[type][name].lastProcessedPosition;

				if (!lowestProcessedPosition || currentPosition < lowestProcessedPosition)
					lowestProcessedPosition = currentPosition;
			});
		});

		if (lowestProcessedPosition === undefined)
			throw new Error('Failed to get lowest processed position.');


		return lowestProcessedPosition;
	}
}

module.exports = EventSequencer;

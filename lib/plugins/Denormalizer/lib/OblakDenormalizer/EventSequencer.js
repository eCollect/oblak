'use strict';

class EventSequencer {
	constructor() {
		this.models = {};
	}

	registerModel(type, name, { position, id }, force = false) {
		if (!name)
			throw new Error('Name is missing.');

		if (!type)
			throw new Error('Type is missing.');

		if (typeof position !== 'number')
			throw new Error('Last processed position is missing.');


		this.models[type] = this.models[type] || {};

		if (!force && this.models[type][name])
			throw new Error('Model had already been registered.');

		this.models[type][name] = {
			position,
			id,
		};

		return this;
	}

	updatePosition(type, name, { position, id }) {
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

		model.position = position;
		model.id = id;
	}

	getModel(type, name) {
		if (!name)
			throw new Error('Name is missing.');

		if (!type)
			throw new Error('Type is missing.');

		return this.models[type][name];
	}

	getLowestProcessedPosition() {
		let lowestProcessedPosition;

		Object.keys(this.models).forEach((type) => {
			Object.keys(this.models[type]).forEach((name) => {
				const currentPosition = this.models[type][name].position;

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

'use strict';

const dotter = require('../../../../utils/dotter');

module.exports = class ViewModel {
	constructor({ id = '', attributes = { id }, exists = false }) {
		this.attributes = attributes;
		this.id = id;
		this.exists = exists;
		this.deleted = false;
	}

	get operation() {
		if (this.deleted)
			return 'delete';
		if (this.exists)
			return 'update';
		return 'create';
	}

	get(prop) {
		return dotty.get(this.attributes, prop);
	}

	set(prop, value) {
		if (value !== undefined)
			return dotter.set(this.attributes, prop, value);

		if (!prop || typeof prop !== 'object' || Array.isArray(prop))
			return;

		this.attributes = Object.assign(this.attributes, prop); // { ...this.attributes, ...prop };
		return this;
	}

	destroy() {
		this.deleted = true;
	}
};

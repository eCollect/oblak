'use strict';

const dotter = require('../../../../utils/dotter');

module.exports = class ViewModel {
	constructor({ id = '', attributes = {}, exists = false, version = null }) {
		this.attributes = attributes;
		this.attributes.id = id;
		this.id = id;

		this.exists = exists;
		this.deleted = false;

		this.version = version;
	}

	get operation() {
		if (this.deleted)
			return 'delete';
		if (this.exists)
			return 'update';
		return 'create';
	}

	get(prop) {
		return dotter.get(this.attributes, prop);
	}

	set(prop, value) {
		if (value !== undefined)
			return dotter.set(this.attributes, prop, value);

		if (!prop || typeof prop !== 'object' || Array.isArray(prop))
			return this;

		this.attributes = Object.assign(this.attributes, prop); // { ...this.attributes, ...prop };
		return this;
	}

	destroy() {
		this.deleted = true;
	}
};

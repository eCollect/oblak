'use strict';

class Base {
	constructor(name, description) {
		if (!name)
			throw new Error('OblakApp must have a name');

		this.name = name;
		this.description = description;
	}

	link(app) {
		this.app = app.getProcess(this.name);
	}
}

module.exports = Base;

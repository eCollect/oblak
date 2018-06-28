'use strict';

const SpaService = require('./SpaService');

const DEFAULT_SERVICE_NAME = 'spa';

class Spa {
	constructor({
		name = DEFAULT_SERVICE_NAME,
	} = {}) {
		this.name = name;
	}

	processes({ spa }) { // eslint-disable-line
		return Object.keys(spa).map(type => new SpaService({ type, name: `${this.name}:${type}` })).filter(a => a);
	}
}

module.exports = Spa;

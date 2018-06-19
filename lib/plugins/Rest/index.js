'use strict';

const RestService = require('./RestService');

const DEFAULT_SERVICE_NAME = 'rest';

class Rest {
	constructor({
		name = DEFAULT_SERVICE_NAME,
	} = {}) {
		this.name = name;
	}

	processes({ rest }) { // eslint-disable-line
		return Object.keys(rest).map(type => new RestService({ type, name: `${this.name}:${type}` })).filter(a => a);
	}
}

module.exports = Rest;

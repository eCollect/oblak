'use strict';

const DenormalizerService = require('./DenomralizerService');

class Denormalizer {
	constructor({
		name = 'denormalizer',
	} = {}) {
		this.name = name;
	}

	processes({ readmodels }) { // eslint-disable-line
		return Object.keys(readmodels).map(type => new DenormalizerService({ type, name: `${this.name}:${type}` })).filter(a => a);
	}
}

module.exports = Denormalizer;

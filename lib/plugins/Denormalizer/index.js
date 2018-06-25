'use strict';

const DenormalizerService = require('./DenomralizerService');

class Denormalizer {
	constructor({
		name = 'denormalizer',
	} = {}) {
		this.name = name;
	}

	processes({ readmodels, config }) { // eslint-disable-line
		return Object.keys(readmodels).filter(type => config.denormalizers[type]).map(type => new DenormalizerService({ type, name: `${this.name}:${type}` })).filter(a => a);
	}
}

module.exports = Denormalizer;

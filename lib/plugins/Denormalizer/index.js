'use strict';

const ViewModelDenormalizerService = require('./services/ViewModelDenomralizerService');
const ListModelDenormalizerService = require('./services/ListModelDenormalizerService');

const typeMapping = {
	listmodel: ListModelDenormalizerService,
	list: ListModelDenormalizerService,
	view: ViewModelDenormalizerService,
	viewmodel: ViewModelDenormalizerService,
	_default: ViewModelDenormalizerService,
};

class Denormalizer {
	constructor({
		name = 'denormalizer:viewmodel',
	} = {}) {
		this.name = name;
	}

	processes({ readmodels, config }) { // eslint-disable-line
		return Object.keys(readmodels).filter(type => config.denormalizers[type]).map((type) => {
			const Service = typeMapping[config.denormalizers[type].type] || typeMapping._default;
			return new Service({ type, name: `${this.name}:${type}` });
		}).filter(a => a);
	}
}

module.exports = Denormalizer;

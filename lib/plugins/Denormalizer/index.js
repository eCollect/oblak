'use strict';

const Eventstore = require('../shared/Eventstore');

const ViewModelDenormalizerService = require('./services/ViewModelDenomralizerService');
const ListModelDenormalizerService = require('./services/ListModelDenormalizerService');
const DenormalizerService = require('./services/DenormalizerService');

const typeMapping = {
	listmodel: ListModelDenormalizerService,
	list: ListModelDenormalizerService,
	// viewPlus: ListModelDenormalizerService2,
	view: ViewModelDenormalizerService,
	viewmodel: ViewModelDenormalizerService,
	main: DenormalizerService,
	_default: DenormalizerService,
};

class Denormalizer {
	constructor({
		name = 'readmodels',
	} = {}) {
		this.name = name;
		this._services = [];
	}

	processes({ readmodels, config }) { // eslint-disable-line
		this._services = Object.keys(readmodels).filter(type => config.denormalizers[type]).map((type) => {
			const Service = typeMapping[config.denormalizers[type].type] || typeMapping._default;
			return new Service({ type, group: this.name, name: `${this.name}:${type}` });
		}).filter(a => a);
		return this._services;
	}

	async rebuildCommand(oblak, konzola, u, params) {
		const { models } = params;
		const services = this._services.filter(s => models === true || models.includes(s.type));

		const eventstore = new Eventstore(oblak._kellner); // eventstore
		await eventstore.init();

		const rebuilds = await Promise.all(services.map(async (s) => {
			await s.link(oblak._kellner, oblak);
			return s.getReplayStream(oblak, konzola);
		}));

		const eventsStream = eventstore.getReplay({});
		for await (const event of eventsStream)
			for (const rebuild of rebuilds)
				rebuild.stream.write(event);

		for (const rebuild of rebuilds)
			rebuild.done();

		// eventstore.

		// console.log(u);
	}
}

module.exports = Denormalizer;

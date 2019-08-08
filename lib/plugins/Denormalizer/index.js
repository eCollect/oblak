'use strict';

const Eventstore = require('../shared/Eventstore');

const ViewModelDenormalizerService = require('./services/ViewModelDenomralizerService');
const ListModelDenormalizerService = require('./services/ListModelDenormalizerService');
const DenormalizerService = require('./services/DenormalizerService');

const { pipeline } = require('../../utils/stream');

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

	async rebuildCommand(oblak, emitter, u, params) {
		const { models } = params;
		const services = this._services.filter(s => models === true || models.includes(s.type));

		const [service] = services;

		const eventstore = new Eventstore(oblak._kellner); // eventstore
		await eventstore.init();


		await service.link(oblak._kellner, oblak);
		const replayStream = await service.getReplayStream(oblak, emitter);
		const eventsStream = eventstore.getReplay({});

		emitter.start(service.type, await eventstore.getReplay({}).count());
		await service.denormalizerStream.denormalizer.clear();
		await pipeline(
			eventsStream,
			replayStream.stream,
		);

		replayStream.done();
		/*
		for await (const event of eventsStream) {
			console.log(++i);
		}
		*/
		/*
			for (const rebuild of rebuilds)
				rebuild.stream.write(event);
		*/

	}
}

module.exports = Denormalizer;

'use strict';

const OblakWire = require('../shared/OblakWire');
const SagaStream = require('./SagaStream');

const DEFAULT_SERVICE_NAME = 'saga';

const getBindingKey = ({ config, readmodels }, type) => {
	const { readmodels: sagaReadmodelsType } = config.sagas[type];
	if (!sagaReadmodelsType || !readmodels[sagaReadmodelsType])
		return 'event.domain.#';
	return `event.denormalized.${sagaReadmodelsType}.#`;
};

class SagaService extends OblakWire {
	constructor({
		type,
		sagaName,
		name = `${DEFAULT_SERVICE_NAME}:${type}:${sagaName}`,
	} = {}) {
		super(name);
		this.sagaName = sagaName;
		this.type = type;
		this.sagaStream = null;
		this.app = null;
	}

	linkService(app, oblak) {
		super.linkService(app, oblak);

		this.app.eventbus.in(new this.app.wires.eventbus.amqp.Receiver(this.name, { bindingKey: getBindingKey(oblak, this.type) }));
		this.sagaStream = new SagaStream(this.app, this);
		this.app.eventbus.incoming.pipe(this.sagaStream).pipe(this.app.commandbus.outgoing);

		return this;
	}

	async init(oblak) {
		await super.init(oblak);
		await this.sagaStream.init(oblak);
	}

	// use with extreme care
	async clear(oblak) {
		super.clear(oblak);
		const log = this.app.services.getLogger();
		log.info(`Clearing Sagas ${this.sagaName}...`);

		await this.sagaStream.init(oblak, this);
		await this.sagaStream.clear();

		log.info(`Sagas ${this.sagaName} cleared.`);
	}
}

module.exports = SagaService;

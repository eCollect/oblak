'use strict';

const OblakWire = require('../shared/OblakWire');
const SagaStream = require('./SagaStream');
const DeferredApi = require('../shared/WireApi/DeferredApi');

const DEFAULT_SERVICE_NAME = 'saga';

class SagaService extends OblakWire {
	constructor({
		sagaName,
		name = `${DEFAULT_SERVICE_NAME}:${sagaName}`,
	} = {}) {
		super(name);
		this.sagaName = sagaName;
		this.sagaStream = null;
		this.app = null;
	}

	link(app, oblak) {
		super.link(app, oblak);

		this.sagaApiBuilder = new DeferredApi({
			app,
			wire: this,
			crud: oblak.crud,
			readmodels: oblak.readmodels,
			domain: oblak.domain,
		});

		this.app.eventbus.in(new this.app.wires.eventbus.amqp.Receiver(this.name));

		this.sagaStream = new SagaStream(this.app, this);

		this.app.eventbus.incoming.pipe(this.sagaStream).pipe(this.app.commandbus.outgoing);

		return this;
	}

	async init(oblak) {
		await this.sagaStream.init(oblak);
	}
}

module.exports = SagaService;

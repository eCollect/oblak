'use strict';

const Base = require('../../shared/Base');
const DenormalizerStream = require('./ViewModelDenormalizerStream');

const DEFAULT_SERVICE_NAME = 'denormalizer';

class DenormalizerService extends Base {
	constructor({
		type,
		name = `${DEFAULT_SERVICE_NAME}:${type}`,
	} = {}) {
		if (!type)
			throw new Error('No denormalizer type provided');

		super(name);
		this.type = type;
		this.denormalizerStream = null;
		this.app = null;
	}

	linkService(app, oblak) {
		this.app.eventbus.in(new this.app.wires.eventbus.amqp.Receiver(this.name, {
			type: 'domain',
			persistent: true,
		}));

		this.app.eventbus.out(new this.app.wires.eventbus.amqp.Sender());
		this.denormalizerStream = new DenormalizerStream(this.app, oblak, this.type, this);
		this.app.eventbus.incoming.pipe(this.denormalizerStream).pipe(this.app.eventbus.outgoing);

		return this;
	}

	async init(oblak) {
		await super.init(oblak);
		await this.denormalizerStream.init(oblak, this);
	}

	shouldRun({ denormalizer }) {
		return denormalizer || denormalizer.includes(this.type);
	}
}

module.exports = DenormalizerService;

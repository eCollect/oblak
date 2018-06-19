'use strict';

const Base = require('../shared/Base');
const DenormalizerStream = require('./DenormalizerStream');

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

	link(app, oblak) {
		super.link(app);

		this.app.eventbus.in(new this.app.wires.eventbus.amqp.Receiver(this.name, {
			type: 'domain',
			persistent: true,
		}));

		this.app.eventbus.out(new this.app.wires.eventbus.amqp.Sender());

		this.denormalizerStream = new DenormalizerStream(this.app, oblak, this.type);

		this.app.eventbus.incoming.pipe(this.denormalizerStream).pipe(this.app.eventbus.outgoing);

		return this;
	}

	async init(oblak) {
		await this.denormalizerStream.init(oblak);
	}

	shouldRun({ denormalizer }) {
		return denormalizer || denormalizer.includes(this.type);
	}
}

module.exports = DenormalizerService;

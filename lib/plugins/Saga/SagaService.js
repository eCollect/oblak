'use strict';

const Base = require('../shared/Base');
const SagaStream = require('./SagaStream');
const CommandSenderStream = require('./CommandSenderStream');
const WireApi = require('../shared/WireApi');


const DEFAULT_SERVICE_NAME = 'saga';

const getBindingKey = ({ config, readmodels }, type) => {
	const { readmodels: sagaReadmodelsType } = config.sagas[type];
	if (!sagaReadmodelsType || !readmodels[sagaReadmodelsType])
		return 'event.domain.#';
	return `event.denormalized.${sagaReadmodelsType}.#`;
};

class SagaService extends Base {
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

	link(app, oblak) {
		return super.link(app, oblak, WireApi);
	}

	linkService(app, oblak) {
		// send commands
		this.app.commandbus.out(new this.app.wires.commandbus.amqp.Sender());


		// recive notifications
		this.app.notificationbus.in(new this.app.wires.notificationbus.amqp.Receiver(this.name, {}));
		this.app.notificationbus.incoming.on('data', () => {}); // prevent memory leaks

		// recieve events
		this.app.eventbus.in(new this.app.wires.eventbus.amqp.Receiver(this.name, {
			bindingKey: getBindingKey(oblak, this.type),
		}));

		// create stream
		this.sagaStream = new SagaStream(this.app, this);
		this.commandSenderStream = new CommandSenderStream(this.app, this);

		this.app.eventbus.incoming.pipe(this.sagaStream).pipe(this.commandSenderStream);
		return this;
	}

	async init(oblak) {
		await super.init(oblak);
		await this.sagaStream.init(oblak);
	}

	// use with extreme care
	async clear(oblak, silent = false) {
		const log = this.app.services.getLogger();
		if (!silent)
			log.info(`Clearing Sagas ${this.sagaName}...`);

		await this.sagaStream.init(oblak, this);
		await this.sagaStream.clear();
		await this.app.eventbus.clear();

		if (!silent)
			log.info(`Sagas ${this.sagaName} cleared.`);
	}

	async getExportStream(app) {
		this.app = app.getProcess(this.name);
		const sagaStream = new SagaStream(this.app, this);
		return sagaStream.getExportStream();
	}

	async getImportStream(app) {
		this.app = app.getProcess(this.name);
		this.sagaStream = new SagaStream(this.app, this);
		return this.sagaStream.getImportStream();
	}

	async internalClear(oblak, app) {
		this.app = app.getProcess(this.name);
		this.sagaStream = new SagaStream(this.app, this);
		await this.sagaStream.externalClear(oblak);
		await this.app.eventbus.clear();
	}

	shouldRun({ saga }) {
		return saga && (saga.includes('.') || saga.includes(this.type));
	}
}

module.exports = SagaService;

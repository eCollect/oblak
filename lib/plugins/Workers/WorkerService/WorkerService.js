'use strict';

const DEFAULT_SERVICE_NAME = 'worker';
const OblakWire = require('../../shared/OblakWire');

const WorkerStream = require('./WorkerStream.js');

class WorkerService extends OblakWire {
	constructor({
		type,
		workerName,
		workerPath,
		name = `${DEFAULT_SERVICE_NAME}:${type}:${workerName}`,
	} = {}) {
		super(name);
		this.name = name;
		this.type = type;
		this.workerName = workerName;

	}

	link(app, oblak) {
		super.link(app, oblak);
	}

	linkService(app, oblak) {
		// setup wires
		super.linkService(app, oblak);
		this.app.jobbus.in(new this.app.wires.jobbus.amqp.Receiver(this.name, { bindingKey: this.name.replace(/:/g, '.') }));

		this.workerStream = new WorkerStream(this.app, this, this.type, this.workerName);

		return this;
	}

	async init(oblak) {
		await super.init(oblak, oblak);
		await this.workerStream.init(oblak, this);
	}

	async onReady() {
		this.app.jobbus.incoming.pipe(this.workerStream); // .pipe(this.commandSenderStream);
	}

	get serviceName() { // eslint-disable-line
		return DEFAULT_SERVICE_NAME;
	}

	// eslint-disable-next-line class-methods-use-this
	shouldRun({ worker }) {
		return false;
	}
}

module.exports = WorkerService;

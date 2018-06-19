'use strict';

const { PassThrough } = require('stream');

const Base = require('./Base');

const ServicesStore = require('../shared/ServicesStore');
const ReadModelStore = require('../shared/ReadmodelsStore');
const CrudModelStore = require('../shared/CrudModelStore');

const WireApi = require('./WireApi');

const CommandRunner = require('./WireApi/CommandRunner');

const partOf = require('./partOf');

class OblakWire extends Base {
	link(app, oblak) {
		super.link(app, oblak);

		// send commands
		this.app.commandbus.out(new this.app.wires.commandbus.amqp.Sender());
		// recive notifications
		this.app.notificationbus.in(new this.app.wires.notificationbus.amqp.Receiver(this.name, {}));
		// send notifications and optionally events
		this.app.eventbus.out(new this.app.wires.eventbus.amqp.Sender());

		this.servicesStore = new ServicesStore(this.app);
		this.readmodelStore = new ReadModelStore(this.app);
		this.crudmodelStore = new CrudModelStore(this.app);

		this.wireApi = new WireApi({
			app: this.app,
			wire: this,
			crud: oblak.crud,
			domain: oblak.domain,
			readmodels: oblak.readmodels,
			services: oblak.services,
			errors: oblak.errors,
		});

		return this;
	}

	sendNotification(evt) {
		this.app.eventbus.outgoing.write(evt);
	}

	sendCommand(cmd) {
		this.app.commandbus.outgoing.write(cmd);
	}

	addCommandToSend(command) {
		command = new this.app.Command(command);
		return new CommandRunner({
			potok: this.app,
			command,
			wire: this,
		});
	}

	subscribeToEvents(where = {}) {
		const stream = new PassThrough({ objectMode: true });

		const onData = (event) => {
			if (!partOf(where, event))
				return;

			stream.write(event);
		};

		const unsubscribe = () => this.app.notificationbus.incoming.removeListener('data', onData);
		this.app.notificationbus.incoming.on('data', onData);
		return {
			stream,
			unsubscribe,
		};
	}
}

module.exports = OblakWire;


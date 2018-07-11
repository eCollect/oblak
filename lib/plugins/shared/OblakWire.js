'use strict';

const { PassThrough } = require('stream');

const Base = require('./Base');

const WireApi = require('./WireApi');

const CommandRunner = require('./WireApi/CommandRunner');

const partOf = require('./partOf');

class OblakWire extends Base {
	link(app, oblak) {
		return super.link(app, oblak, WireApi);
	}

	linkService(app, oblak) {
		// send commands
		this.app.commandbus.out(new this.app.wires.commandbus.amqp.Sender());
		// recive notifications
		this.app.notificationbus.in(new this.app.wires.notificationbus.amqp.Receiver(this.name, {}));
		// send notifications and optionally events
		this.app.eventbus.out(new this.app.wires.eventbus.amqp.Sender());

		/*
		this.wireApi = new WireApi({
			app: this.app,
			wire: this,
			crud: oblak.crud,
			domain: oblak.domain,
			readmodels: oblak.readmodels,
			services: oblak.services,
			errors: oblak.errors,
		});
		*/

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

	read({ type, collection }, query = {}, one = false) {
		const method = one ? 'readOne' : 'read';
		return this.readmodelStore[method]({ type, collection }, query);
	}

	readStream({ type, collection }, query = {}, one = false) {
		const method = one ? 'readOne' : 'read';
		const incomingStream = this.readmodelStore[method]({ type, collection }, query);

		// The outgoingStream is the stream that is used to send data to the
		// client over some push mechanism such as SSE or web sockets.
		const outgoingStream = new PassThrough({ objectMode: true });

		// When the client disconnects actively, we need to stop sending
		// results, hence we unpipe. This pauses the incomingStream, which
		// still may have unread data in it. Hence we need to resume it
		// to make sure that there are no unread data left in memory that
		// keeps the GC from removing the stream. Additionally, if the
		// incomingStream is a live stream, there is no one that will ever
		// call end() on the stream, hence we need to do it here to avoid
		// the stream to stay open forever.
		outgoingStream.once('finish', () => {
			incomingStream.unpipe(outgoingStream);
			incomingStream.resume();
		});

		// Now, start the actual work and pipe the results to the client.
		incomingStream.pipe(outgoingStream);

		return outgoingStream;
	}

	// query readmodel
	query(type, name, metadata, id) {
		return this.readmodelStore.query(type, name, metadata, id)
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

	async init(oblak) {
		await super.init(oblak);
	}
}

module.exports = OblakWire;

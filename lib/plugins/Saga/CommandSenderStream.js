'use strict';

const CommandRunner = require('../shared/WireApi/CommandRunner');

const { OblakTransform } = require('../shared/streams');
const EventsSubscribtionStream = require('../shared/streams/EventsSubscribtionStream');


module.exports = class CommandSenderStream extends OblakTransform {
	constructor(app, wire) {
		super(app);
		this.Command = app.Command;
		this.wire = wire;
	}

	_write({ command, next }, _, done) {
		// this.app.commandbus.outgoing.write(new this.Command(command));
		// done(null);
		// prepare runner
		const runner = new CommandRunner({
			potok: this.app,
			command: new this.Command(command),
			wire: this,
		});

		// execure runner without awaitng, but ensure delivery
		runner.exec(next);
		done(null);
	}

	sendCommand(cmd) {
		this.app.commandbus.outgoing.write(cmd);
	}

	subscribeToEvents(where = {}) {
		const stream = new EventsSubscribtionStream(where);

		const onData = e => stream.write(e);
		const unsubscribe = () => this.app.notificationbus.incoming.removeListener('data', onData);
		this.app.notificationbus.incoming.on('data', onData);

		return {
			stream,
			unsubscribe,
		};
	}
};

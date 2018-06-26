'use strict';

const noop = () => {};

const DEFAULT_TIMEOUT = 10 * 100000;

const promiseCallback = ({ resolve, reject }) => (err, result) => {
	if (err) return reject(err);
	return resolve(result);
};

module.exports = class CommandRunner {
	constructor({
		potok, // potok/kellner
		command,
		wire,
	}) {
		this.potok = potok;
		this.command = command;
		this.wire = wire;
		this.defaultTimeout = DEFAULT_TIMEOUT;
		this.callbacks = {
			await: null,
			delivered: noop,
			timeout: {
				duration: this.defaultTimeout,
				callback: noop,
				id: null,
			},
			exec: noop,
		};
		this.commandReceived = false;
		this.stopSubscribtion = null;
	}

	exec(callback) {
		if (typeof callback === 'function') {
			this.callbacks.exec = callback;
			return this._exec();
		}

		return new Promise((resolve, reject) => {
			this.callbacks.exec = promiseCallback({ resolve, reject });
			this._exec();
		});
	}

	timeout(duration, callback = noop) {
		this.callbacks.timeout.duration = duration;
		this.callbacks.timeout.callback = callback;
		return this;
	}

	await(events, callback = noop) {
		if (!events)
			return this;

		if (!Array.isArray(events))
			events = [events];

		this.callbacks.await = {};

		events.forEach((event) => { this.callbacks.await[event] = callback; });
		return this;
	}

	delivered(callback) {
		if (typeof callback === 'function')
			this.callbacks.delivered = callback;
	}

	// promise-like interface
	catch(reject) {
		return this.exec().catch(reject);
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	_exec() {
		const { unsubscribe, stream } = this.wire.subscribeToEvents({
			metadata: { correlationId: this.command.id },
		});

		this.stopSubscribtion = unsubscribe;
		stream.on('data', e => this._handleEvent(e));

		this.wire.sendCommand(this.command);
		this.callbacks.timeout.id = setTimeout(() => {
			this._clear(new Error('timeout'));
			this.callbacks.timeout.callback();
		}, this.callbacks.timeout.duration);
	}

	_clear(error, result) {
		clearTimeout(this.callbacks.timeout.id);
		if (this.stopSubscribtion)
			this.stopSubscribtion();
		this.callbacks.exec(error, result);
	}

	_onCommandReceived() {
		this.deliverd = true;
		this.callbacks.deliverd();
	}

	_handleEvent(event) {
		if (event.fullname === this.potok.events.commandReceived.fullname) {
			this.commandReceived = true;
			this.callbacks.delivered(this.command);
			// not await any events, just release after delivered!
		}

		if (!this.callbacks.await) {
			this._clear(null, event);
			return;
		}

		if (this.callbacks.await[event.fullname]) {
			this.callbacks.await[event.fullname](event, this.command);
			this._clear(null, event);
		}
	}
};

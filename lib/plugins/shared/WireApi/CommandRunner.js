'use strict';

const nm = require('nanomatch');

const noop = () => {};

const DEFAULT_TIMEOUT = 10 * 1000;

const promiseCallback = ({ resolve, reject }) => (err, result) => {
	if (err)
		return reject(err);
	return resolve(result);
};

const matchFirst = (str = '', patterns = []) => patterns.find(p => nm.isMatch(str, p));

const { CommandRejectedError, CommandTimeoutError } = require('../../../tools/errors');

const rejectedRegex = new RegExp(/Rejected$/);
const isRejected = fullname => rejectedRegex.test(fullname);

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
			failed: noop,
			await: {
				keys: [],
				callbacks: null,
			},
			delivered: noop,
			timeout: {
				duration: this.defaultTimeout,
				callback: noop,
				id: null,
			},
			exec: noop,
		};
		this.commandRecived = false;
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

	failed(callback = noop) {
		this.callbacks.failed = callback;
	}

	await(events, callback = noop) {
		if (!events)
			return this;

		if (!Array.isArray(events))
			events = [events];

		if (!this.callbacks.await.callbacks)
			this.callbacks.await.callbacks = {};

		events.forEach((event) => {
			if (!this.callbacks.await.callbacks[event])
				this.callbacks.await.keys.push(event);
			this.callbacks.await.callbacks[event] = callback;
		});
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
			this._clear(new CommandTimeoutError('timeout'));
			this.callbacks.timeout.callback();
		}, this.callbacks.timeout.duration);
	}

	_clear(error, result) {
		clearTimeout(this.callbacks.timeout.id);
		if (this.stopSubscribtion)
			this.stopSubscribtion();
		this.callbacks.exec(error, result);
	}

	_onCommandRecived() {
		this.deliverd = true;
		this.callbacks.deliverd();
	}

	_handleEvent(event) {
		if (event.fullname === this.potok.events.commandRecived.fullname) {
			this.commandRecived = true;
			this.callbacks.delivered(this.command);
		}

		if (isRejected(event.fullname)) {
			this._clear(CommandRejectedError.fromEvent(event));
			return;
		}

		// not await any events, just release after deliverd!
		if (!this.callbacks.await.callbacks) {
			this._clear(null, event);
			return;
		}

		const matchedCallback = matchFirst(event.fullname, this.callbacks.await.keys);
		if (matchedCallback) {
			this.callbacks.await.callbacks[matchedCallback](event, this.command);
			this._clear(null, event);
		}
	}
};

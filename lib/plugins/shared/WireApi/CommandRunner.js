'use strict';

const nm = require('nanomatch');

const { noop } = require('../../../utils');

const DEFAULT_TIMEOUT = 0; // 10 * 1000;

const promiseCallback = ({ resolve, reject }) => (err, result) => {
	if (err)
		return reject(err);
	return resolve(result);
};

const anySymbol = Symbol('any:event');

const matchFirst = (str = '', patterns = []) => patterns.find(p => nm.isMatch(str, p));

const { OblakError } = require('../../../tools/errors');

const rejectedRegex = new RegExp(/commandRejected$/);
const receivedRegex = new RegExp(/commandReceived$/);

const isRejected = fullName => rejectedRegex.test(fullName);
const isReceived = fullName => receivedRegex.test(fullName);

module.exports = class CommandRunner {
	constructor({
		potok, // potok/kellner
		command,
		wire,
	}) {
		this.potok = potok;
		this.command = command;
		this.id = command.id;
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
		this.ensureDelivery = true;
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

	failed(callback = noop) {
		this.callbacks.failed = callback;
	}

	await(events, callback = noop) {
		if (!events || typeof events === 'function') {
			callback = events || callback;
			events = anySymbol;
		}

		if (!Array.isArray(events))
			events = [events];

		if (!this.callbacks.await.callbacks)
			this.callbacks.await.callbacks = {};

		events.forEach((event) => {
			if (typeof event === 'string' && !this.callbacks.await.callbacks[event])
				this.callbacks.await.keys.push(event);
			this.callbacks.await.callbacks[event] = callback;
		});
		return this;
	}

	delivered(callback) {
		if (typeof callback === 'function')
			this.callbacks.delivered = callback;
		return this;
	}

	fireAndForget() {
		this.ensureDelivery = false;
		return this;
	}

	// promise-like interface
	catch(reject) {
		return this.exec().catch(reject);
	}

	then(resolve, reject) {
		return this.exec().then(resolve, reject);
	}

	_exec() {
		if (!this.ensureDelivery) {
			this.callbacks.exec(null, this.wire.sendCommand(this.command));
			return;
		}

		const { unsubscribe, stream } = this.wire.subscribeToEvents({
			metadata: { causationId: this.command.metadata.causationId },
		});

		this.stopSubscribtion = unsubscribe;
		stream.on('data', e => this._handleEvent(e));

		this.wire.sendCommand(this.command);

		if (this.callbacks.timeout.duration > 0)
			this.callbacks.timeout.id = setTimeout(() => {
				this._clear(new OblakError.errors.CommandTimeoutError('timeout'));
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
		const isCommandRecivedEvent = isReceived(event.fullname);

		if (isCommandRecivedEvent) {
			this.commandReceived = true;
			this.callbacks.delivered(this.command);
		}

		if (isRejected(event.fullname)) {
			this._clear(OblakError.fromEvent(event));
			return;
		}

		// not await any events, just release after delivered!
		if (!this.callbacks.await.callbacks) {
			this._clear(null, event);
			return;
		}

		if (isCommandRecivedEvent)
			return;

		// awaitng any
		if (this.callbacks.await.callbacks[anySymbol]) {
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

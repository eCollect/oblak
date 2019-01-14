'use strict';

const { PassThrough } = require('stream');

const steps = [
	'events',
	'positions',
	'snapshots',
];

class StreamConcat extends PassThrough {
	constructor(events, positions, snapshots) {
		super({ objectMode: true });
		this.currentStep = -1;
		this.currentStream = null;
		this.collections = {
			events,
			positions,
			snapshots,
		};
		this.running = false;
		// this.on('pipe');
	}

	_read() {
		if (!this.currentStream)
			this.nextStream();
	}

	addStream(newStream) {
		if (this.canAddStream)
			this.streams.push(newStream);
		else
			this.emit('error', new Error('Can\'t add stream.'));
	}

	nextStream() {
		this.currentStream = null;
		this.currentStep += 1;
		if (this.currentStep >= steps.length)
			return this.end();

		const step = steps[this.currentStep];
		this.push({ $evenstoreCollection: step });
		this.currentStream = this.collections[step].find();
		// this.currentStream.pipe(this, { end: false });

		this.currentStream = this.collections[step].find();
		this.currentStream.on('error', e => this.emit('error', e));
		this.currentStream.on('end', () => this.goNext());

		return this.currentStream.on('data', d => this.push(d));
	}

	goNext() {
		this.currentStream.removeAllListeners('error');
		this.currentStream.removeAllListeners('end');
		this.nextStream();
	}
}

module.exports = StreamConcat;

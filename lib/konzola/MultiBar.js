'use strict';

// from https://gist.github.com/nuxlli/b425344b92ac1ff99c74
// with some modifications & additions

const ProgressBar = require('progress');

const emptyObj = {
	newBar() {
		return {
			tick() {},
			terminate() {},
			update() {},
			render() {},
		};
	},
	terminate() {},
	move() {},
	tick() {},
	update() {},
	isTTY: false,
};

function MultiProgress(stream) {
	const multi = Object.create(MultiProgress.prototype);
	multi.stream = stream || process.stderr;

	if (!multi.stream.isTTY)
		return emptyObj;


	multi.cursor = 0;
	multi.bars = [];
	multi.terminates = 0;

	return multi;
}

MultiProgress.prototype = {
	newBar(schema, options) {
		options.stream = this.stream;
		const bar = new ProgressBar(schema, options);
		this.bars.push(bar);
		const index = this.bars.length - 1;

		// alloc line
		this.move(index);
		this.stream.write('\n');
		this.cursor += 1;

		// replace original
		const self = this;
		bar.otick = bar.tick;
		bar.oterminate = bar.terminate;
		bar.oupdate = bar.update;
		bar.tick = function tick(value, op) {
			self.tick(index, value, op);
		};
		bar.terminate = function terminate() {
			self.terminates += 1;
			if (self.terminates === self.bars.length)
				self.terminate();
		};
		bar.update = function update(value, op) {
			self.update(index, value, op);
		};

		return bar;
	},

	terminate() {
		this.move(this.bars.length);
		this.stream.clearLine();
		this.stream.cursorTo(0);
	},

	move(index) {
		this.stream.moveCursor(0, index - this.cursor);
		this.cursor = index;
	},

	tick(index, value, options) {
		const bar = this.bars[index];
		if (bar) {
			this.move(index);
			bar.otick(value, options);
		}
	},

	update(index, value, options) {
		const bar = this.bars[index];
		if (bar) {
			this.move(index);
			bar.oupdate(value, options);
		}
	},
};

module.exports = MultiProgress;

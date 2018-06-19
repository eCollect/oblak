'use strict';

const OblakWire = require('../shared/OblakWire');

class CommandTester extends OblakWire {
	constructor({
		name = 'commandTester',
	} = {}) {
		super(name);
	}
}

module.exports = CommandTester;

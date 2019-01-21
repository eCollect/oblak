'use strict';

const { command, event } = require('cqrs-swissknife/domain/tools/');

// additions to command tooling
command.extend = commandExtender => ({ commandExtender });

command.handle = {
	// unused anymore as it is supported nativley by cqrs-swissknife
	async: (handler) => {
		if (!handler || typeof handler !== 'function')
			throw new Error('Handler is missing or not a function.');

		return handler;
	},
};

module.exports = {
	command,
	event,
};

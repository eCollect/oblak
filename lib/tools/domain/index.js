'use strict';

const { command, event } = require('cqrs-swissknife/domain/tools/');
const { noop } = require('../../utils');

// additions to command tooling
command.extend = commandExtender => ({ commandExtender });

command.handle = {
	async: (handler) => {
		if (!handler || typeof handler !== 'function')
			throw new Error('Handler is missing or not a function.');

		return [
			{
				preCondition: handler,
				mode: 'async_handle',
			},
			noop,
		];
	},
};

module.exports = {
	command,
	event,
};

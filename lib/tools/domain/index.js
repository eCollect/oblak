'use strict';

const { command, event } = require('cqrs-swissknife/domain/tools/');

const handleDefferedEvents = (_, agg) => {
	agg.__deferredEventsSymbol.forEach(params => agg.apply(...params));
};

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
			handleDefferedEvents,
		];
	},
};

module.exports = {
	command,
	event,
};

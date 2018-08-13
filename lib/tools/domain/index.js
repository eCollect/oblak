'use strict';

const { command, event } = require('cqrs-swissknife/domain/tools/');

command.extend = commandExtender => ({ commandExtender });

module.exports = {
	command,
	event,
};

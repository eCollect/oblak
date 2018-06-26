'use strict';

const CommandRunner = require('./WireApi/CommandRunner');

const buildCommand = ({
	app, wire, aggregate, context, name,
}) => (payload, metadata) => {
	const command = new app.Command({
		name,
		aggregate,
		context,
		payload,
		metadata,
	});
	return new CommandRunner({
		potok: app,
		command,
		wire,
	});
};

const buildDomain = ({ app, wire, domain }) => {
	const domainObj = {};

	Object.entries(domain).forEach(([contextName, contextObj]) => {
		domainObj[contextName] = {};
		Object.entries(contextObj).forEach(([aggregateName, aggregateObj]) => {
			domainObj[contextName][aggregateName] = id => Object.keys(aggregateObj.commands).reduce((commands, commandName) => {
				commands[commandName] = buildCommand({
					name: commandName,
					app,
					wire,
					context: contextName,
					aggregate: {
						name: aggregateName,
						id,
					},
				});
				return commands;
			}, {});
		});
	});
	return domainObj;
};

module.exports = buildDomain;

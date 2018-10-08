'use strict';

const buildDomain = (_, { domain }) => {
	const domainObj = {};

	Object.entries(domain).forEach(([contextName, contextObj]) => {
		domainObj[contextName] = {};
		Object.entries(contextObj).forEach(([aggregateName, aggregateObj]) => {
			domainObj[contextName][aggregateName] = Object.entries(aggregateObj.commands).reduce((commands, [name, data]) => {
				commands[name] = {
					context: contextName,
					aggregate: aggregateName,
					name,
					schema: data.schema,
				};
				return commands;
			}, {});
		});
	});
	return domainObj;
};

module.exports = buildDomain;

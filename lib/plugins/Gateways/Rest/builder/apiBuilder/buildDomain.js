'use strict';

const buildDomain = (_, { domain }) => {
	const domainObj = {};

	Object.entries(domain).forEach(([contextName, contextObj]) => {
		domainObj[contextName] = {};
		Object.entries(contextObj).forEach(([aggregateName, aggregateObj]) => {
			domainObj[contextName][aggregateName] = Object.keys(aggregateObj.commands).reduce((commands, name) => {
				commands[name] = {
					context: contextName,
					aggregate: aggregateName,
					name,
				};
				return commands;
			}, {});
		});
	});
	return domainObj;
};

module.exports = buildDomain;

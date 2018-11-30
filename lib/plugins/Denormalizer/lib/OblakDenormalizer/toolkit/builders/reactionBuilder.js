'use strict';


const { noop } = require('../../../../../../utils');

const flat = arr => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flat(b) : b), []);

const toFlatArray = (workflow) => {
	if (!Array.isArray(workflow))
		return [workflow];
	return flat(workflow);
};

const nameRetriever = {
	/**
	 * Supports two fomat of event names : [context].[domain].[agg] OR [type].[context].[domain].[agg]
	 */
	event: (eventFullName) => {
		const split = eventFullName.split('.');
		if (split.length === 4)
			return split;
		return ['domain', ...split];
	},
};

module.exports = ({ eventFullName, reaction, identifier }, _, customApiBuilder = noop) => {
	eventFullName = nameRetriever.event(eventFullName).join('.');

	reaction = toFlatArray(reaction);

	const actions = [];
	const settings = {};

	reaction.forEach((item) => {
		// event handler
		if (typeof item === 'function')
			actions.push(item);

		if (item.useAsId)
			identifier = item.useAsId;
	});

	return {
		settings,
		identifier,
		eventFullName,
		actions,
		customApiBuilder,
	};
};

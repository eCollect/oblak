'use strict';


const { noop } = require('../../../../../../utils');

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

module.exports = ({ eventFullName, reaction }, _, customApiBuilder = noop) => {
	eventFullName = nameRetriever.event(eventFullName).join('.');

	if (!Array.isArray(reaction))
		reaction = [reaction];

	let action;

	reaction.forEach((item) => {
		// event handler
		if (typeof item === 'function')
			action = (collection, evt) => Promise.resolve(item(collection, evt, customApiBuilder(collection, evt)));
	});

	return {
		eventFullName,
		action,
	};
};

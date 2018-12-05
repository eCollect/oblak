'use strict';

const dotty = require('dotty');

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

const dottyfy = str => evt => dotty.get(evt, str);
const retunify = obj => () => obj;

const functionify = (obj, functionBuilder = retunify) => {
	if (!obj)
		return null;

	if (typeof obj === 'function')
		return obj;

	return functionBuilder(obj);
};

module.exports = ({
	eventFullName,
	reaction,
	identifier,
	query,
}, _, customApiBuilder = noop) => {
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

	if (!identifier && !query)
		throw new Error(`No identifier or query sepcified for event ${eventFullName}.`);

	return {
		settings,
		query: functionify(identifier, dottyfy) || functionify(query, retunify),
		eventFullName,
		actions,
		customApiBuilder,
	};
};

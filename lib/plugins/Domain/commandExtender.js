'use strict';


class CommandExtender {
	constructor(extenders) {
		this._extenders = extenders;
	}

	async extend(command) {
		const {
			context,
			aggregate,
			name,
		} = command;
		const extender = this._extenders[`${context}.${aggregate.name}.${name}`];
		if (!extender)
			return command;

		return extender(command);
	}
}

const getExtender = (command) => {
	if (!Array.isArray(command))
		command = [command];
	for (let item of command) { // eslint-disable-line
		if ('commandExtender' in item)
			return item.commandExtender;
	}
	return null;
};

const getAggregate = (extenders = {}, context, aggregate, { commands = {} }, apiFactory) => {
	Object.entries(commands).forEach(([name, command]) => {
		const extender = getExtender(command);
		if (!extender || typeof extender !== 'function')
			return;
		extenders[`${context}.${aggregate}.${name}`] = cmd => Promise.resolve(extender(cmd, apiFactory()));
	});
	return extenders;
};


const getDomain = ({ domain }, apiFactory) => {
	let extenders = {};
	Object.keys(domain).forEach(ctx => Object.keys(domain[ctx]).forEach((agg) => {
		extenders = getAggregate(extenders, ctx, agg, require(domain[ctx][agg].path), apiFactory); // eslint-disable-line
	}));
	return new CommandExtender(extenders);
};

module.exports = {
	build: getDomain,
};

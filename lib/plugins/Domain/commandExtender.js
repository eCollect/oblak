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
		const extenders = this._extenders[`${context}.${aggregate.name}.${name}`];

		if (!extenders || !extenders.length)
			return;

		for (const extender of extenders)
			await extender(command);
	}
}

const getExtender = (command) => {
	if (!Array.isArray(command))
		command = [command];

	return command.reduce((arr, item) => {
		if ('commandExtender' in item)
			arr.push(item.commandExtender);
		return arr;
	}, []);
};

const getAggregate = (extenders = {}, context, aggregate, { commands = {} }, apiFactory) => {
	Object.entries(commands).forEach(([name, command]) => {
		const extender = getExtender(command);
		if (!extender || !extender.length)
			return;

		extenders[`${context}.${aggregate}.${name}`] = extender.filter(e => typeof e === 'function').map(e => cmd => Promise.resolve(e(cmd, apiFactory())));
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

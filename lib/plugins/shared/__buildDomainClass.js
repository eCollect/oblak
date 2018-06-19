'use strict';

const CommandRunner = require('./WireApi/CommandRunner');

const metadataSymbol = Symbol('oblak:domain:metadata');

const buildAggregateClass = ({
	app, wire, commands, aggregate, context,
}) => {
	function Aggregate(metadata) {
		this[metadataSymbol] = metadata;
	}

	Object.keys(commands).forEach((name) => {
		Aggregate.prototype[name] = function commandRunner(payload, metadata) {
			metadata = { ...metadata, ...this[metadataSymbol] };
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
	});
	return Aggregate;
};


const buildContextClass = ({
	app, wire, context, contextObj,
}) => {
	function Context(metadata) {
		this[metadataSymbol] = metadata;
	}

	Object.entries(contextObj).forEach(([aggregate, aggregateObj]) => {
		const Aggregate = buildAggregateClass({
			app, wire, commands: aggregateObj.commands, aggregate, context,
		});
		Object.defineProperty(Context.prototype, aggregate, {
			get() {
				return new Aggregate(this[metadataSymbol]);
			},
		});
	});

	return Context;
};

const buildDomainClass = ({ app, wire, domain }) => {
	function Domain(metadata) {
		this[metadataSymbol] = metadata;
	}

	Object.entries(domain).forEach(([context, contextObj]) => {
		const Context = buildContextClass({
			app, wire, context, contextObj,
		});

		Object.defineProperty(Domain.prototype, context, {
			get() {
				return new Context(this[metadataSymbol]);
			},
		});
	});
	return Domain;
};

module.exports = buildDomainClass;

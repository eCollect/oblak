'use strict';

const CommandRunner = require('./CommandRunner');

const { metadataSymbol, idSymbol } = require('./symbols');

const buildAggregateClass = ({
	app, wire, commands, aggregateName, context,
}) => {
	function Aggregate(id, metadata) {
		this[metadataSymbol] = metadata;
		this[idSymbol] = id;
	}

	Object.keys(commands).forEach((name) => {
		Aggregate.prototype[name] = function commandRunner(payload, metadata) {
			metadata = { ...metadata, ...this[metadataSymbol] };
			const command = new app.Command({
				name,
				aggregate: {
					name: aggregateName,
					id: this[idSymbol],
				},
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

	Object.entries(contextObj).forEach(([aggregateName, aggregateObj]) => {
		const Aggregate = buildAggregateClass({
			app, wire, commands: aggregateObj.commands, aggregateName, context,
		});
		Context.prototype[aggregateName] = function aggregateRunner(id) {
			return new Aggregate(id, this[metadataSymbol]);
		};
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

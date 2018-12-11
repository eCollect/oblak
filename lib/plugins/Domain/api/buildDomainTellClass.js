'use strict';

const { metadataSymbol, idSymbol } = require('../../shared/WireApi/symbols');

const buildAggregateClass = ({
	app, wire, commands, aggregateName, context,
}) => {
	function Aggregate(id, metadata) {
		this[metadataSymbol] = metadata;
		this[idSymbol] = id;
	}

	Object.keys(commands).forEach((name) => {
		Aggregate.prototype[name] = function commandRunner(payload, metadata) {
			metadata = { ...this[metadataSymbol], ...metadata };
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
			return wire.sendCommand(new app.Command(command));
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

const buildDomainTellClass = ({ app, wire, domain }) => {
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

module.exports = buildDomainTellClass;

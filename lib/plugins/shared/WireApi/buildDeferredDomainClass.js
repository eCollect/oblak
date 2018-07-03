'use strict';

const { metadataSymbol, idSymbol, commandRunnerSymbol } = require('./symbols');

const buildAggregateClass = ({
	commands, aggregateName, context,
}) => {
	function Aggregate(id, metadata, commandRunner) {
		this[metadataSymbol] = metadata;
		this[idSymbol] = id;
		this[commandRunnerSymbol] = commandRunner;
	}

	Object.keys(commands).forEach((name) => {
		Aggregate.prototype[name] = function commandRunner(payload, metadata) {
			metadata = { ...this[metadataSymbol], ...metadata };
			return this[commandRunnerSymbol].addCommandToSend({
				name,
				aggregate: {
					name: aggregateName,
					id: this[idSymbol],
				},
				context,
				payload,
				metadata,
			});
		};
	});
	return Aggregate;
};


const buildContextClass = ({
	context, contextObj,
}) => {
	function Context(metadata, commandRunner) {
		this[metadataSymbol] = metadata;
		this[commandRunnerSymbol] = commandRunner;
	}

	Object.entries(contextObj).forEach(([aggregateName, aggregateObj]) => {
		const Aggregate = buildAggregateClass({
			commands: aggregateObj.commands, aggregateName, context,
		});
		Context.prototype[aggregateName] = function aggregateRunner(id) {
			return new Aggregate(id, this[metadataSymbol], this[commandRunnerSymbol]);
		};
	});

	return Context;
};

const buildDomainClass = ({ domain, name }) => {
	function Domain(metadata, commandRunner) {
		this[metadataSymbol] = metadata;
		this[commandRunnerSymbol] = commandRunner;
	}

	Object.entries(domain).forEach(([context, contextObj]) => {
		const Context = buildContextClass({
			context, contextObj,
		});

		Object.defineProperty(Domain.prototype, context, {
			get() {
				return new Context(this[metadataSymbol], this[commandRunnerSymbol]);
			},
		});
	});
	return Domain;
};

module.exports = buildDomainClass;

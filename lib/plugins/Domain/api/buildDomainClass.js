'use strict';

const buildContextClass = ({
	readFn, context, contextObj,
}) => {
	function Context() {}

	Object.keys(contextObj).forEach((aggregateName) => {
		Context.prototype[aggregateName] = function aggregateReader(id) {
			return readFn(context, aggregateName, id);
		};
	});

	return Context;
};

const buildDomainClass = (readFn, { domain }) => {
	function Domain() {}

	Object.entries(domain).forEach(([context, contextObj]) => {
		const Context = buildContextClass({
			readFn, context, contextObj,
		});

		Object.defineProperty(Domain.prototype, context, {
			get() {
				return new Context();
			},
		});
	});
	return Domain;
};

module.exports = buildDomainClass;

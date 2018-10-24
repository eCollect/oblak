'use strict';

const buildDomainReadClass = require('./buildDomainReadClass');
const buildDomainTellClass = require('./buildDomainTellClass');

const aggregateReader = stream => (context, aggregate, id) => new Promise((res, rej) => {
	const ctx = stream.cqrsDomain.tree.getContext(context);
	const agg = ctx.getAggregate(aggregate);
	agg.defaultCommandHandler.loadAggregate({
		name: '__load',
		context,
		aggregate: {
			name: aggregate,
		},
	}, id, (err, a) => {
		if (err)
			return rej(err);
		return res(a);
	});
});

module.exports = (stream, wire, { domain }) => {
	const DomainReadClass = buildDomainReadClass(aggregateReader(stream), { domain });
	const DomainTellClass = buildDomainTellClass({ app: stream.app, wire, domain });

	return cmd => ({
		...wire.wireApi.get(),
		getDomain: () => new DomainReadClass(),
		tell: () => new DomainTellClass(cmd.metadata),
	});
};

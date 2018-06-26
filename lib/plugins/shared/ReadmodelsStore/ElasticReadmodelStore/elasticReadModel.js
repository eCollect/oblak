'use strict';

const bodybuilder = require('bodybuilder');

module.exports = (client, { index }) => {
	const builder = bodybuilder();

	builder.exec = () => client.search({
		index,
		type: index,
		body: builder.build(),
	});

	return builder;
};

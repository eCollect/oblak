'use strict';

const merge = require('lodash.merge');

const { oblakOperation } = require('./symbols');

const defaultIdRetriever = req => req.params.id;
const defaultPayloadRetriever = req => req.body;
const defaultMethod = 'post';

const getStringCommand = (str, domain) => {
	const parts = str.split('.');
	if (parts.legnth < 3)
		throw new Error('Invalid command string.');

	// domain.cntext.aggregate.command
	if (parts.length === 4)
		parts.splice(0, 1);

	const [context, aggregate, command] = parts;
	return domain[context][aggregate][command];
}

const empty = {};

const commandMiddleware = ({
	command,
	event,
	id = defaultIdRetriever,
	payload = defaultPayloadRetriever,
	schema = {},
}) => {
	if (!command)
		throw new Error('Invalid command');

	return {
		schema: merge({ body: command.schema }, schema),
		handler: (req, res, next) => {
			const aggregateId = id(req);
			const cmdPayload = payload(req);
			req.getApp().getDomain()[command.context][command.aggregate](aggregateId)[command.name](cmdPayload).await(event).exec((err, result) => {
				if (err)
					return next(err);
				return res.json(result.payload);
			});
		},
	};
};

module.exports = (cmd, method = defaultMethod) => ({
	[oblakOperation]: (addAction, { domain }) => {
		const data = cmd(domain);
		if (typeof data.command === 'string')
			data.command = getStringCommand(data.command, domain);

		const middleware = commandMiddleware(cmd(domain));
		return addAction ? { [method]: middleware } : middleware;
	},
	// method: method.toLowerCase(),
});

'use strict';

const { oblakOperation } = require('./symbols');

const defaultIdRetriever = req => req.params.id;
const defaultPayloadRetriever = req => req.body;
const defaultMethod = 'post';

const commandMiddleware = ({
	command,
	event,
	id = defaultIdRetriever,
	payload = defaultPayloadRetriever,
}) => ({
	schema: command.schema,
	handler: (req, res, next) => {
		const aggregateId = id(req);
		const cmdPayload = payload(req);
		req.getApp().getDomain()[command.context][command.aggregate](aggregateId)[command.name](cmdPayload).await(event).exec((err, result) => {
			if (err)
				return next(err);
			return res.json(result.payload);
		});
	},
});

module.exports = (cmd, method = defaultMethod) => ({
	[oblakOperation]: (addAction, { domain }) => {
		const middleware = commandMiddleware(cmd(domain));
		return addAction ? { [method]: middleware } : middleware;
	},
	// method: method.toLowerCase(),
});

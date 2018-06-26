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
}) => (req, res, next) => {
	const aggregateId = id(req);
	const cmdPayload = payload(req);
	req.getApp().getDomain()[command.context][command.aggregate](aggregateId)[command.name](cmdPayload).await(event).exec((err, result) => {
		if (err)
			return next(err);
		return res.json(result.payload);
	});
};

module.exports = cmd => ({
	[oblakOperation]: (addAction, { domain }) => {
		const { method = defaultMethod, ...data } = cmd(domain);
		const middleware = commandMiddleware(data);
		return addAction ? { [method]: middleware } : middleware;
	},
});

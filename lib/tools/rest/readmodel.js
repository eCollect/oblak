'use strict';

const { oblakOperation } = require('./symbols');

const defaultIdRetriver = req => req.params.id;
const defaultPayloadRetriver = req => req.body;
const defaultMethod = 'post';

const commandMiddleware = ({
	command,
	event,
	id = defaultIdRetriver,
	payload = defaultPayloadRetriver,
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
	[oblakOperation]: ({ domain }) => {
		const { method = defaultMethod, ...data } = cmd(domain);
		return {
			[method]: commandMiddleware(data),
		};
	},
});

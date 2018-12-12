'use strict';

const debugMiddleware = (err, req, res, next) => {
	res.status(err.statusCode || 500);
	const error = {};
	error.code = err.errorCode;
	error.message = err.message;
	error.data = err.data || err.toJson ? err.toJson() : null;
	error.stack = err.stack;
	res.json({ error });
	next();
};

// "TypeError: rule is not a function    at evaluateRule (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/lib/plugins/shared/AccessRightsManager/CanAccess.js:6:16)    at CanAccess.readmodel (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/lib/plugins/shared/AccessRightsManager/CanAccess.js:21:10)    at ReadmodelsStore.canAccess (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/lib/plugins/shared/ReadmodelsStore/index.js:28:40)    at ReadmodelsStore.query (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/lib/plugins/shared/ReadmodelsStore/index.js:81:26)    at ReadmodelType.query [as entity] (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/lib/plugins/shared/WireApi/buildReadmodelsClass.js:12:31)    at routes./.async (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/app/gateways/spa/team/routes/entities.js:20:56)    at /Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/lib/tools/rest/async.js:6:2    at Layer.handle [as handle_request] (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/node_modules/express/lib/router/layer.js:95:5)    at next (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/node_modules/express/lib/router/route.js:137:13)    at Route.dispatch (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/node_modules/express/lib/router/route.js:112:3)    at Layer.handle [as handle_request] (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/node_modules/express/lib/router/layer.js:95:5)    at /Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/node_modules/express/lib/router/index.js:281:22    at Function.process_params (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/node_modules/express/lib/router/index.js:335:12)    at next (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/node_modules/oblak/node_modules/express/lib/router/index.js:275:10)    at session.verify.then (/Users/mitkonanov/Projects/ECOLLECTV2/ecollect-v2-oblak/app/services/team/auth.js:35:10)"
/*
const productionMiddleware = (err, req, res, next) => {
	res.status(err.statusCode || 500);
	const body = {};
	body.code = err.errorCode;
	body.data = err.toJson ? err.toJson() : null;
	body.message = err.message;
	res.json(body);
	next();
};
*/

module.exports = debugMiddleware;

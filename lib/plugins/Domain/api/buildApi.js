'use strict';

module.exports = (wire, getDomain) => () => {
	const domain = getDomain();
	const baseApi = wire.wireApi.get();
	return baseApi;
};

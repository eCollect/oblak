'use strict';

const url = require('url');
const WebSocket = require('ws');
const uuid = require('uuid/v4');

const SocketConnection = require('./SocketConnection');
const WsApi = require('./api/index');


module.exports = (server, app, wire, oblak) => {
	const { ws: wsSetup } = wire._getSetup(oblak);

	const wsServer = new WebSocket.Server({
		server,
		async verifyClient(info, done) {
			const data = url.parse(info.req.url, true).query || {};
			const req = {
				oblakApp: wire.name,
				getApp: () => wire.wireApi.get(req.oblakMetadata || {}),
				params: data,
				socket: {
					uniqueId: uuid(),
				},
			};

			for (const middleware of wsSetup.connection)
				try {
					await middleware(req);
				} catch (e) {
					return done(false);
				}

			info.req.info = req;
			return done(true);
		},
	});
	const { BadRequestError } = oblak.errors;

	const api = new WsApi({
		app,
		wire,
		BadRequestError,
	}, wsSetup);

	wsServer.on('connection', (socket, req) => new SocketConnection({
		app: this.app, wire, socket, api,
	}, wsSetup, req.info));

	return wsServer;
};

'use stirct';

const WebSocket = require('ws');

const SocketConnection = require('./SocketConnection');
const WsApi = require('./api/index')

module.exports = (server, app, wire, oblak) => {
	const wsServer = new WebSocket.Server({ server });
	const { BadRequestError } = oblak.errors;
	const api = new WsApi({
		app,
		wire,
		BadRequestError,
	});
	wsServer.on('connection', socket => new SocketConnection({ app: this.app, wire, socket, api }));
	return wsServer;
}

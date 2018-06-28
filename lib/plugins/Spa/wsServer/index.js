'use stirct';

const WebSocket = require('ws');

const SocketConnection = require('./SocketConnection');
const WsApi = require('./api/index')

module.exports = ({
	server,
	app,
	wire,
}) => {
	const wsServer = new WebSocket.Server({ server });
	const api = new WsApi({
		app,
		wire,
	})
	wsServer.on('connection', socket => new SocketConnection({ app: this.app, wire, socket, api }));
	return wsServer;
}

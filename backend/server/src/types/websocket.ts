type ClientValue = {
	socket: import("ws").WebSocket | null,
	connected: boolean,
	connectedAt: number,
	deviceId: string
};

type ClientMap = Map<number, ClientValue>

type GameRooms = Map<string, BackendGameRoom>

type ClientThis = {
	userId: number,
	deviceId: string,
	socket: import("ws").WebSocket
}
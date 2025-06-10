type ClientValue = {
	socket: import("ws").WebSocket | null,
	connected: boolean,
	connectedAt: number,
	connectedToLobby: null | LobbyRoom,
	deviceId: string
};

type ClientMap = Map<number, ClientValue>

type GameRooms = Map<string, LobbyRoom>

type ClientThis = {
	userId: number,
	deviceId: string,
	socket: import("ws").WebSocket
}
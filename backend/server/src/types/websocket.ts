type ClientValue = {
	socket: import("ws").WebSocket | null,
	connceted: boolean,
	connectedAt: number,
	deviceId: string
};

type ClientMap = Map<number, ClientValue>
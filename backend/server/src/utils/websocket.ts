import type { RawData } from "ws";
import type { WebSocket } from "@fastify/websocket"
import { connectedSocketClients } from "@api/websocket";

export const processRawData = (data: RawData): string => {
	if (Buffer.isBuffer(data)) {
		return data.toString('utf-8');
	} else if (data instanceof ArrayBuffer) {
		const uint8Array = new Uint8Array(data);
		return new TextDecoder('utf-8').decode(uint8Array);
	} else if (Array.isArray(data) && data.every(Buffer.isBuffer)) {
		const concatenatedBuffer = Buffer.concat(data);
		return concatenatedBuffer.toString('utf-8');
	} else {
		throw new Error("Unsupported RawData format");
	}
}

/**
 * 
 * @param userId 
 * @param deviceId 
 * @returns `true` if user not found. `false` if user is found and deviceId does not match the stored one in the server
 */
export const userCanLogIn = (userId: number, deviceId: string): boolean => {
	for (const entry of connectedSocketClients.entries()) {
		const [entryUserId, clientValue] = entry;
		if (userId === entryUserId) {
			return clientValue.deviceId === deviceId;
		}
	}
	return true;
}

export const websocketRegisterNewLogin = (userId: number, deviceId: string) => {
	connectedSocketClients.set(userId, newDisconnectedClient(deviceId))
}

const newDisconnectedClient = (deviceId: string): ClientValue => {
	return {
		socket: null,
		connectedAt: 0,
		connceted: false,
		deviceId
	} as const;
}

export const updateDisconnectedClient = (userId: number, socket: WebSocket) => {
	const clientValue = connectedSocketClients.get(userId);
	if (!clientValue) return;
	clientValue.connceted = true;
	clientValue.connectedAt = Date.now();
	clientValue.socket = socket;
}
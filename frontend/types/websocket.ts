import SocketHandler from "@/auth/socketHandler";

declare global {
	type SocketMessageHandler<T extends SocketMessageType = SocketMessageType> = (this: SocketHandler, response: SelectSocketMessage<T>) => void;
}
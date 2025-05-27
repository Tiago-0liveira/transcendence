type SocketMessageBase<T extends string, P extends object = {}> = { type: T } & P;

type SocketMessageType = SocketMessage["type"]

type SocketMessage =
	SocketMessageBase<"friend-online", { friendName: string, avatar: string }>
	| SocketMessageBase<"friend-request", { friendName: string, avatar: string, friendId: number }>
	| SocketMessageBase<"friend-request-accepted", { friendName: string, avatar: string }>
	| SocketMessageBase<"new-game-config", NewGameConfig>
	| SocketMessageBase<"error-new-game-config", { error: string }>
	| SocketMessageBase<"join-game-room", { roomId: string }>
	| SocketMessageBase<"game-room-join-request", { roomId: string }>
	| SocketMessageBase<"game-room-data-update", GameRoom>
	| SocketMessageBase<"game-room-error", { error: string }>
	| SocketMessageBase<"rooms-update", { rooms: BasicPublicRoom[] }>
	| SocketMessageBase<"join-rooms">
	| SocketMessageBase<"leave-game-lobby", { roomId: string, reason?: string }>
	| SocketMessageBase<"delete-game-room", { roomId: string }>

type SelectSocketMessage<T extends SocketMessageType = SocketMessageType> = Extract<SocketMessage, { type: T }>

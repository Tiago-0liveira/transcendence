type SocketMessageBase<T extends string, P extends object> = { type: T } & P;

type SocketMessageType = SocketMessage["type"];

type SocketMessage =
	| SocketMessageBase<"friend-online", { friendName: string; avatar: string }>
	| SocketMessageBase<
			"friend-request",
			{ friendName: string; avatar: string; friendId: number }
	  >
	| SocketMessageBase<
			"friend-request-accepted",
			{ friendName: string; avatar: string }
	  >
	| SocketMessageBase<
			"private-message",
			{ friendName: string; friendId: number; payload: string }
	  >;
// | SocketMessageBase<"room-message", { roomName: string; payload: string }>;

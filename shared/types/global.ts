type SocketMessageBase<T extends string, P extends object = {}> = {
  type: T;
} & P;

type SocketMessageType = SocketMessage["type"];

type SocketMessage =
  /** Common */
  | SocketMessageBase<"friend-online", { friendName: string; avatar: string }>
  | SocketMessageBase<
      "friend-request",
      { friendName: string; avatar: string; friendId: number }
    >
  | SocketMessageBase<
      "friend-request-accepted",
      { friendName: string; avatar: string }
    >
  | SocketMessageBase<"new-game-config", NewGameConfig>
  | SocketMessageBase<"error-new-game-config", { error: string }>
  /** Lobby */
  | SocketMessageBase<"lobby-room-join", { roomId: string }>
  | SocketMessageBase<"lobby-room-join-request", { roomId: string }>
  | SocketMessageBase<"lobby-room-data-update", LobbyRoom>
  | SocketMessageBase<"lobby-room-error", { error: string }>
  | SocketMessageBase<"lobby-room-leave", { roomId: string; reason?: string }>
  | SocketMessageBase<"lobby-room-delete", { roomId: string }>
  | SocketMessageBase<
      "lobby-room-player-set-ready",
      { roomId: string; ready: boolean }
    >
  | SocketMessageBase<"lobby-room-start-game", { roomId: string }>
  /** Open Rooms */
  | SocketMessageBase<"rooms-update", { rooms: BasicPublicLobby[] }>
  | SocketMessageBase<"rooms-join">
  /** Game */
  | SocketMessageBase<"game-room-join", { roomId: string; gameId: string }>
  | SocketMessageBase<"game-room-leave", { roomId: string; gameId: string }>
  | SocketMessageBase<"game-room-error", { error: string }>
  | SocketMessageBase<
      "game-room-player-set-ready",
      { roomId: string; gameId: string; ready: boolean }
    >
  | SocketMessageBase<"game-room-data-update", Game>
  | SocketMessageBase<
      "game-room-player-input",
      { roomId: string; gameId: string; up: boolean; down: boolean }
    >
  | SocketMessageBase<
      "chat-notification",
      {
        source: number;
        target?: number;
        content: string;
      }
    >
  | SocketMessageBase<
      "chat-message",
      {
        source: number;
        sourceName: string;
        timestamp: Date;
        target?: number;
        content: string;
        isPrivateMessage: boolean;
      }
    >;

type SelectSocketMessage<T extends SocketMessageType = SocketMessageType> =
  Extract<SocketMessage, { type: T }>;

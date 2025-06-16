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
      "new-irc-notification",
      {
        // command: string;
        // params: string[];
        source?: number;
        target: number;
        // content: string;
      }
    >
  | SocketMessageBase<
      "new-irc-message",
      {
        command: string;
        params: string[];
        source?: number;
        target: number;
        content: string;
        isPrivateMessage: boolean;
        isChannelMessage: boolean;
      }
    >;

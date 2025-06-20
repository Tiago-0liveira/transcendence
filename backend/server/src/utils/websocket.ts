import type { RawData } from "ws";
import type { WebSocket } from "@fastify/websocket";
import { connectedSocketClients } from "@api/websocket";
import Database from "@db/Database";

export const processRawData = (data: RawData): string => {
  if (Buffer.isBuffer(data)) {
    return data.toString("utf-8");
  } else if (data instanceof ArrayBuffer) {
    const uint8Array = new Uint8Array(data);
    return new TextDecoder("utf-8").decode(uint8Array);
  } else if (Array.isArray(data) && data.every(Buffer.isBuffer)) {
    const concatenatedBuffer = Buffer.concat(data);
    return concatenatedBuffer.toString("utf-8");
  } else {
    throw new Error("Unsupported RawData format");
  }
};

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
};

export const websocketRegisterNewLogin = (userId: number, deviceId: string) => {
  connectedSocketClients.set(userId, newDisconnectedClient(deviceId));
};

export const isSocketValidMessage = (
  message: any,
): message is SocketMessage => {
  return typeof message === "object" && typeof message.type === "string";
};

const newDisconnectedClient = (deviceId: string): ClientValue => {
  return {
    socket: null,
    connectedAt: 0,
    connected: false,
    connectedToLobby: null,
    isSocketAlive: false,
    deviceId,
  } as const;
};

export const updateDisconnectedClient = (userId: number, socket: WebSocket) => {
  const clientValue = connectedSocketClients.get(userId);
  if (!clientValue) return;
  clientValue.connected = true;
  clientValue.connectedAt = Date.now();
  clientValue.socket = socket;
  clientValue.isSocketAlive = true;
};
//NOTE: Check for blocked receivers and filter them
/**
 * @description notifications via websocket. they just work if the user recieving the notification is already connected to the websocket
 */
export const notify = {
  /**
   * @description dispatches notifications for every friend so they now the user is now online!
   */
  friendsOnline: async (userId: number) => {
    const dbRes = await Database.getInstance().userTable.getById(userId);
    if (dbRes.error) return;
    const user = dbRes.result;

    const friendsWithInfo =
      await Database.getInstance().friendsTable.getFriendsWithInfo(
        userId,
        0,
        5000,
      );
    if (friendsWithInfo.error) return;
    friendsWithInfo.result.forEach((friend) => {
      if (connectedSocketClients.has(friend.id)) {
        const clientValue = connectedSocketClients.get(friend.id);
        if (!clientValue) return;
        clientValue.socket?.send(
          JSON.stringify({
            type: "friend-online",
            friendName: user.displayName,
            avatar: user.avatarUrl,
          } satisfies SocketMessage),
        );
      }
    });
  },

  /**
   * @description dispatches a notification for a specific friend so he nows the user is now online!
   */
  friendOnline: async (userId: number, friendId: number) => {
    const connectedFriend = connectedSocketClients.get(friendId);
    if (
      connectedFriend &&
      connectedFriend.connected &&
      connectedFriend.socket
    ) {
      const dbRes = await Database.getInstance().userTable.getById(userId);
      if (dbRes.error) return;
      const user = dbRes.result;
      connectedFriend.socket.send(
        JSON.stringify({
          type: "friend-online",
          friendName: user.displayName,
          avatar: user.avatarUrl,
        } satisfies SocketMessage),
      );
    }
  },

  /**
   * @description dispatches a notification when a user has accepted the friend request
   */
  friendAcceptedRequest: async (userId: number, friendId: number) => {
    const connectedFriend = connectedSocketClients.get(friendId);
    if (
      connectedFriend &&
      connectedFriend.connected &&
      connectedFriend.socket
    ) {
      const dbRes = await Database.getInstance().userTable.getById(userId);
      if (dbRes.error) return;
      const user = dbRes.result;
      connectedFriend.socket.send(
        JSON.stringify({
          type: "friend-request-accepted",
          friendName: user.displayName,
          avatar: user.avatarUrl,
        } satisfies SocketMessage),
      );
    }
  },

  /**
   * @description dispatches a notification when a user sends a friend request to another user
   */
  friendRequest: async (userId: number, friendId: number) => {
    const connectedFriend = connectedSocketClients.get(friendId);
    if (
      connectedFriend &&
      connectedFriend.connected &&
      connectedFriend.socket
    ) {
      const dbRes = await Database.getInstance().userTable.getById(userId);
      if (dbRes.error) return;
      const user = dbRes.result;
      connectedFriend.socket.send(
        JSON.stringify({
          type: "friend-request",
          friendName: user.displayName,
          avatar: user.avatarUrl,
          friendId: user.id,
        } satisfies SocketMessage),
      );
    }
  },

  tournamenGameReady: async (userId: number, enemyId: number, roomId: string, gameId: string ) => {
    const db = Database.getInstance();

    const socketUser = connectedSocketClients.get(userId);
    const socketEnemy = connectedSocketClients.get(enemyId);

    if (
        (!socketUser || !socketUser.connected || !socketUser.socket) &&
        (!socketEnemy || !socketEnemy.connected || !socketEnemy.socket)
    ) {
      console.warn("Both players are disconnected");
      return;
    }

    const resUser = await db.userTable.getById(userId);
    const resEnemy = await db.userTable.getById(enemyId);

    if (
        resUser.error || !resUser.result ||
        resEnemy.error || !resEnemy.result
    ) {
      console.warn("Error while fetching user");
      return;
    }

    const user = resUser.result;
    const enemy = resEnemy.result;

    if (socketUser?.connected && socketUser.socket) {
      socketUser.socket.send(
          JSON.stringify({
            type: "tournament-game-ready",
            userName: enemy.displayName,
            avatar: enemy.avatarUrl,
            friendId: enemy.id,
            roomId,
            gameId,
          } satisfies SocketMessage)
      );
    }

    if (socketEnemy?.connected && socketEnemy.socket) {
      socketEnemy.socket.send(
          JSON.stringify({
            type: "tournament-game-ready",
            userName: user.displayName,
            avatar: user.avatarUrl,
            friendId: user.id,
            roomId,
            gameId,
          } satisfies SocketMessage)
      );
    }
  },



  //ircChannelMessage
  // TODO: add ChannelTable and call it to get all the users inside the channel
  // and the send the notification

  chatMessage: async (userId: number, friendId: number) => {
    const connectedFriend = connectedSocketClients.get(friendId);
    if (
      connectedFriend &&
      connectedFriend.connected &&
      connectedFriend.socket
    ) {
      const dbRes = await Database.getInstance().userTable.getById(userId);
      if (dbRes.error) return;
      const user = dbRes.result;
      connectedFriend.socket.send(
        JSON.stringify({
          type: "chat-notification",
          source: userId,
          target: friendId,
        } satisfies SocketMessage),
      );
    }
  },
};

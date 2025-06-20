import Database from "@db/Database";
import { activeGameRooms, connectedSocketClients } from "@api/websocket";
import BlockedUsersService from "@utils/BlockedUsersService";

export async function handleChatMessage(
  message: SelectSocketMessage<"chat-message">,
  clientContext: ClientThis,
) {
  if (message.isPrivateMessage) {
    return await handlePrivateMessage(message, clientContext);
  } else {
    return await handleRoomMessage(message, clientContext);
  }
}

/**
 * Handle private message: send to specific friend if not blocked
 */
async function handlePrivateMessage(
  message: SelectSocketMessage<"chat-message">,
  clientContext: ClientThis,
) {
  const blockedUsersService = BlockedUsersService.getInstance();
  if (!message.target) return;
  const blockedFriendsRes = await blockedUsersService.isBlocked(
    clientContext.userId,
    message.target,
  );
  if (!blockedFriendsRes) {
    const connectedClient = connectedSocketClients.get(message.target);
    if (connectedClient && connectedClient.connected && connectedClient.socket)
      connectedClient.socket.send(JSON.stringify(message));
  }
}

/**
 * Handle room message: broadcast to all connected friends (minus blocked ones)
 */
async function handleRoomMessage(
  message: SelectSocketMessage<"chat-message">,
  clientContext: ClientThis,
) {
  const db = Database.getInstance();
  const blockedUsersService = BlockedUsersService.getInstance();

  const blockedFriendsRes = await blockedUsersService.getBlockedUsers(
    clientContext.userId,
  );
  if (blockedFriendsRes.error) {
    return;
  }

  connectedSocketClients.forEach((connectedClient, clientUserId) => {
    if (
      connectedClient.connected &&
      connectedClient.socket &&
      clientUserId !== clientContext.userId &&
      !blockedFriendsRes.result.find((friend) => friend.id === clientUserId)
    ) {
      connectedClient.socket.send(JSON.stringify(message));
    }
  });
}


export async function handleChatInviteToGame(message: SelectSocketMessage<"chat-invite-to-game">, clientContext: ClientThis) {
	const blockedUsersService = BlockedUsersService.getInstance();

	const targetClient = connectedSocketClients.get(message.target)
	if (!targetClient || !targetClient.connected || !targetClient.socket) {
		return clientContext.socket.send(JSON.stringify({
			type: "chat-invite-to-game-error",
			message: "User is offline!"
		} satisfies SelectSocketMessage<"chat-invite-to-game-error">))
	}
	
	const isBlocked = await blockedUsersService.isBlocked(
		message.target,
		clientContext.userId,
	);
	if (isBlocked) {
		return clientContext.socket.send(JSON.stringify({
			type: "chat-invite-to-game-error",
			message: "User blocked you!"
		} satisfies SelectSocketMessage<"chat-invite-to-game-error">))
	}
	const room = activeGameRooms.get(message.roomId)
	if (!room) {
		return clientContext.socket.send(JSON.stringify({
			type: "chat-invite-to-game-error",
			message: "The Room is no longer available!"
		} satisfies SelectSocketMessage<"chat-invite-to-game-error">))
	}
	const user = await Database.getInstance().userTable.getById(clientContext.userId)
	if (user.result) {
		return targetClient.socket.send(JSON.stringify({
			type: "chat-invite-to-game-frontend",
			roomId: room.id,
			roomName: room.name,
			roomType: room.roomType,
			sourceName: user.result.displayName
		} satisfies SelectSocketMessage<"chat-invite-to-game-frontend">))
	}
}
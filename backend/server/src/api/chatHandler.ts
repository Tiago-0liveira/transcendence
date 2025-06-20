import Database from "@db/Database";
import { connectedSocketClients } from "@api/websocket";
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

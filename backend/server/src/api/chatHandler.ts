import Database from "@db/Database";
import { connectedSocketClients } from "@api/websocket";
import BlockedUsersService from "@utils/BlockedUsersService";

export async function handleChatMessage(
  rawMessage: string,
  clientContext: ClientThis,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Parse the incoming socket message (it's already structured, not IRC format)
    const message = JSON.parse(
      rawMessage,
    ) as SelectSocketMessage<"chat-message">;

    console.log(
      `💬 Chat Handler - Processing message from user ${clientContext.userId}`,
    );
    console.log(`   Type: ${message.isPrivateMessage ? "Private" : "Room"}`);
    console.log(`   Content: ${message.content}`);

    if (message.isPrivateMessage) {
      return await handlePrivateMessage(message, clientContext);
    } else if (message.isChannelMessage) {
      return await handleRoomMessage(message, clientContext);
    } else {
      return {
        success: false,
        error: "Message must be either private or room message",
      };
    }
  } catch (error) {
    console.error("💥 Chat Handler error:", error);
    return { success: false, error: "Internal server error" };
  }
}

/**
 * Handle private message: send to specific friend if not blocked
 */
async function handlePrivateMessage(
  message: any,
  clientContext: ClientThis,
): Promise<{ success: boolean; error?: string }> {
  const targetUserId = message.target;
  console.log(
    `📨 Private message from ${clientContext.userId} to ${message.target}`,
  );

  const blockedUsersService = BlockedUsersService.getInstance();

  // Check if either user has blocked the other
  const isBlocked = await blockedUsersService.isBlockedBidirectional(
    senderId,
    targetUserId,
  );
  if (isBlocked) {
    console.log(`🚫 Message blocked: blocking relationship exists`);
    return { success: false, error: "Message blocked" };
  }

  // Send message to target user if they're online
  const delivered = await sendMessageToUser(targetUserId, {
    type: "new-irc-message",
    command: message.command,
    params: message.params,
    source: senderId,
    target: targetUserId,
    content: message.content,
    isPrivateMessage: true,
    isChannelMessage: false,
  });

  if (delivered) {
    console.log(`✅ Private message delivered to user ${targetUserId}`);
    return { success: true };
  } else {
    console.log(`⚠️ User ${targetUserId} is not online`);
    return { success: false, error: "User is not online" };
  }
}

/**
 * Handle room message: broadcast to all connected friends (minus blocked ones)
 */
async function handleRoomMessage(
  message: any,
  clientContext: ClientThis,
): Promise<{ success: boolean; error?: string }> {
  console.log(`📢 Room message from user ${senderId}`);

  const db = Database.getInstance();
  const blockedUsersService = BlockedUsersService.getInstance();

  // Get sender's friends (everyone in the main room)
  const friendsResult = await db.friendsTable.getFriendsWithInfo(
    senderId,
    0,
    1000,
  );
  if (friendsResult.error) {
    return { success: false, error: "Failed to get friends list" };
  }

  const friends = friendsResult.result;
  console.log(`👥 Broadcasting to ${friends.length} friends`);

  // Use service to filter out blocked users
  const friendIds = friends.map((friend) => friend.id);
  const allowedFriendIds = await blockedUsersService.filterBlockedUsers(
    senderId,
    friendIds,
  );

  console.log(
    `🔍 After filtering blocked users: ${allowedFriendIds.length}/${friendIds.length} allowed`,
  );

  const deliveredTo: number[] = [];

  for (const friendId of allowedFriendIds) {
    const friend = friends.find((f) => f.id === friendId);

    // Send message to this friend if they're online
    const delivered = await sendMessageToUser(friendId, {
      type: "new-irc-message",
      command: message.command,
      params: message.params,
      source: senderId,
      target: 0, // Room message
      content: message.content,
      isPrivateMessage: false,
      isChannelMessage: true,
    });

    if (delivered) {
      deliveredTo.push(friendId);
      console.log(
        `✅ Message delivered to ${friend?.displayName} (${friendId})`,
      );
    } else {
      console.log(
        `⚠️ Friend ${friend?.displayName} (${friendId}) is not online`,
      );
    }
  }

  console.log(
    `📊 Room message delivered to ${deliveredTo.length}/${allowedFriendIds.length} online friends`,
  );
  return { success: true };
}

/**
 * Send message to a specific user if they're connected
 */
async function sendMessageToUser(
  userId: number,
  message: SocketMessage,
): Promise<boolean> {
  const clientValue = connectedSocketClients.get(userId);

  if (clientValue && clientValue.connected && clientValue.socket) {
    try {
      clientValue.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`❌ Failed to send message to user ${userId}:`, error);
      return false;
    }
  }

  return false;
}

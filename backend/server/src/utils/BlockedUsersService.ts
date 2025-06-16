import Database from "@db/Database";

class BlockedUsersService {
  private static instance: BlockedUsersService;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  static getInstance(): BlockedUsersService {
    if (!BlockedUsersService.instance) {
      BlockedUsersService.instance = new BlockedUsersService();
    }
    return BlockedUsersService.instance;
  }

  /**
   * Check if userA has blocked userB
   */
  async isBlocked(userId: number, targetUserId: number): Promise<boolean> {
    return await this.db.blockedUsersTable.isBlocked(userId, targetUserId);
  }

  /**
   * Check if either user has blocked the other (bidirectional check)
   */
  async isBlockedBidirectional(
    userId1: number,
    userId2: number,
  ): Promise<boolean> {
    const user1BlockedUser2 = await this.isBlocked(userId1, userId2);
    const user2BlockedUser1 = await this.isBlocked(userId2, userId1);
    return user1BlockedUser2 || user2BlockedUser1;
  }

  /**
   * Block a user
   */
  async blockUser(
    userId: number,
    userToBlockId: number,
  ): Promise<DatabaseResult<number>> {
    return await this.db.blockedUsersTable.new({
      userId,
      blockedUserId: userToBlockId,
    });
  }

  /**
   * Unblock a user
   */
  async unblockUser(
    userId: number,
    userToUnblockId: number,
  ): Promise<DatabaseResult<boolean>> {
    return await this.db.blockedUsersTable.unblock(userId, userToUnblockId);
  }

  /**
   * Get list of users blocked by a user
   */
  async getBlockedUsers(userId: number): Promise<DatabaseResult<FriendUser[]>> {
    return await this.db.blockedUsersTable.getBlockedUsers(userId);
  }

  /**
   * Filter out blocked users from a list of user IDs
   */
  async filterBlockedUsers(
    fromUserId: number,
    targetUserIds: number[],
  ): Promise<number[]> {
    const filteredUsers: number[] = [];

    for (const targetUserId of targetUserIds) {
      const isBlocked = await this.isBlockedBidirectional(
        fromUserId,
        targetUserId,
      );
      if (!isBlocked) {
        filteredUsers.push(targetUserId);
      }
    }

    return filteredUsers;
  }
}

export default BlockedUsersService;

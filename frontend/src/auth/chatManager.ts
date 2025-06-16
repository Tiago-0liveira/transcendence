import SocketHandler from "@/auth/socketHandler";
import AuthManager from "@/auth/authManager";

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  senderId: number;
  senderName: string;
  isPrivateMessage: boolean;
  isChannelMessage: boolean;
  target?: number;
}

type ChatMessageHandler = (message: ChatMessage) => void;

class ChatManager {
  private static instance: ChatManager;
  private socketHandler: SocketHandler;
  private messageHandlers: Set<ChatMessageHandler> = new Set();
  private currentUserId: number;

  private constructor() {
    this.socketHandler = SocketHandler.getInstance();
    this.currentUserId = AuthManager.getInstance().User?.id || 0;
    this.setupMessageHandler();
  }

  static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  private setupMessageHandler() {
    // Subscribe to chat messages using the existing socket handler
    this.socketHandler.addMessageHandler("chat-message", (message: any) => {
      console.log("ChatManager received message:", message);
      this.handleIncomingMessage(message);
    });
  }

  private handleIncomingMessage(wsMessage: any) {
    // Convert WebSocket message to ChatMessage format
    const chatMessage: ChatMessage = {
      id: Date.now().toString(),
      content: wsMessage.content,
      timestamp: new Date(),
      senderId: wsMessage.source || 0,
      senderName: this.getSenderName(wsMessage.source),
      isPrivateMessage: wsMessage.isPrivateMessage,
      isChannelMessage: wsMessage.isChannelMessage,
      target: wsMessage.target,
    };

    // Notify all registered handlers
    this.messageHandlers.forEach((handler) => handler(chatMessage));
  }

  private getSenderName(senderId: number): string {
    // For now, return a simple format
    // In a real app, you might want to cache user names or fetch them
    if (senderId === this.currentUserId) {
      return "You";
    }
    return `User ${senderId}`;
  }

  /**
   * Send a private message to a specific user
   */
  sendPrivateMessage(content: string, targetUserId: number): boolean {
    if (!content.trim()) return false;

    const message: SelectSocketMessage<"chat-message"> = {
      type: "chat-message",
      source: this.currentUserId,
      target: targetUserId,
      content: content.trim(),
      isPrivateMessage: true,
      isChannelMessage: false,
    };

    this.socketHandler.sendMessage(message);
    return true;
  }

  /**
   * Send a message to the general room (all friends)
   */
  sendRoomMessage(content: string): boolean {
    if (!content.trim()) return false;

    const message: SocketMessage = {
      type: "chat-message",
      source: this.currentUserId,
      target: 0,
      content: content.trim(),
      isPrivateMessage: false,
      isChannelMessage: true,
    };

    this.socketHandler.sendMessage(message);
    return true;
  }

  /**
   * Subscribe to incoming chat messages
   */
  onMessage(handler: ChatMessageHandler) {
    this.messageHandlers.add(handler);
  }

  /**
   * Unsubscribe from chat messages
   */
  offMessage(handler: ChatMessageHandler) {
    this.messageHandlers.delete(handler);
  }

  /**
   * Get connection status from the socket handler
   */
  get isConnected(): boolean {
    return this.socketHandler["socket"]?.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to WebSocket (uses existing SocketHandler)
   */
  connect() {
    console.log("ChatManager: connection is managed by socketHandler");
    // this.socketHandler.connect();
    //
  }

  /**
   * Disconnect from WebSocket (uses existing SocketHandler)
   */
  disconnect() {
    // this.socketHandler.disconnect();

    console.log("ChatManager: disconnection is managed by socketHandler");
  }

  /**
   * Clean up ChatManager when socket disconnects
   */
  cleanup() {
    console.log("ChatManager: Cleaning up...");

    // Clear all message handlers
    this.messageHandlers.clear();

    // Remove our subscription from SocketHandler
    this.socketHandler.removeMessageHandler("chat-message");

    console.log("ChatManager: Cleanup completed");
  }

  /**
   * Reset ChatManager for reconnection
   */
  reset() {
    console.log("ChatManager: Resetting for reconnection...");

    // Clear handlers but keep the instance
    this.messageHandlers.clear();

    // Re-setup message handler for new connection
    this.setupMessageHandler();
  }
}

export default ChatManager;
export type { ChatMessage };

import ChatManager, { type ChatMessage } from "@/auth/chatManager";
import AuthManager from "@/auth/authManager";

// Updated types to match actual usage
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "friend";
  senderId?: number;
  senderName?: string;
}

interface Conversation {
  id: string;
  title: string;
  targetId?: number;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
  isPrivate: boolean;
}

// Utility functions extracted to improve readability
class ChatUtils {
  static formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString();
  }

  static scrollToBottom(element: HTMLElement): void {
    setTimeout(() => {
      element.scrollTop = element.scrollHeight;
    }, 100);
  }

  static createMessageElement(message: Message): string {
    return `
      <div class="flex ${message.sender === "user" ? "justify-end" : "justify-start"}">
        <div class="max-w-[85%] px-3 py-2 rounded-lg text-xs ${
          message.sender === "user"
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        }">
          <p>${message.content}</p>
          <p class="text-[10px] mt-1 opacity-70">${this.formatTime(message.timestamp)}</p>
        </div>
      </div>
    `;
  }
}

// Separate class for managing UI state and rendering
class ChatUI {
  private container: HTMLElement;
  private isCollapsed = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.updateSidebarState();
  }

  private updateSidebarState(): void {
    const sidebar = this.container.querySelector(
      ".chat-sidebar",
    ) as HTMLElement;
    if (sidebar) {
      sidebar.className = sidebar.className.replace(
        /w-\d+/,
        this.isCollapsed ? "w-16" : "w-80",
      );
    }

    const expandedContent = this.container.querySelector(
      ".expanded-content",
    ) as HTMLElement;
    if (expandedContent) {
      expandedContent.style.display = this.isCollapsed ? "none" : "flex";
    }

    const toggleIcon = this.container.querySelector(
      "#toggle-sidebar svg path",
    ) as SVGPathElement;
    if (toggleIcon) {
      toggleIcon.setAttribute(
        "d",
        this.isCollapsed
          ? "M13 5l7 7-7 7M5 5l7 7-7 7"
          : "M11 19l-7-7 7-7M19 19l-7-7 7-7",
      );
    }
  }

  updateConversationsList(
    conversations: Conversation[],
    activeId: string | null,
  ): void {
    const conversationsContainer = this.container.querySelector(
      "#conversations-list",
    );
    if (!conversationsContainer) return;

    conversationsContainer.innerHTML = conversations
      .map((conversation) =>
        this.createConversationItem(conversation, activeId),
      )
      .join("");
  }

  private createConversationItem(
    conversation: Conversation,
    activeId: string | null,
  ): string {
    return `
      <div class="conversation-item p-2 mx-2 mb-1 rounded-md cursor-pointer transition-colors hover:bg-sidebar-accent ${
        activeId === conversation.id ? "bg-sidebar-accent" : ""
      }" data-conversation-id="${conversation.id}">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-sidebar-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sidebar-foreground truncate text-sm">${conversation.title}</div>
            ${conversation.lastMessage ? `<div class="text-xs text-sidebar-foreground/70 truncate">${conversation.lastMessage}</div>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  updateActiveConversation(conversation: Conversation | null): void {
    const activeContainer = this.container.querySelector(
      "#active-conversation",
    );
    if (!activeContainer) return;

    if (!conversation) {
      activeContainer.innerHTML = "";
      return;
    }

    activeContainer.innerHTML = `
      <div class="border-b border-sidebar-border p-3 flex-shrink-0">
        <h3 class="font-medium text-sidebar-foreground text-sm">${conversation.title}</h3>
      </div>
      <div class="flex-1 overflow-y-auto p-3 space-y-3" id="messages-container">
        ${conversation.messages.map((msg) => ChatUtils.createMessageElement(msg)).join("")}
      </div>
    `;

    const messagesContainer = this.container.querySelector(
      "#messages-container",
    ) as HTMLElement;
    if (messagesContainer) {
      ChatUtils.scrollToBottom(messagesContainer);
    }
  }

  addMessageToUI(
    conversationId: string,
    message: Message,
    isActiveConversation: boolean,
  ): void {
    if (isActiveConversation) {
      const messagesContainer = this.container.querySelector(
        "#messages-container",
      ) as HTMLElement;
      if (messagesContainer) {
        const messageElement = document.createElement("div");
        messageElement.innerHTML = ChatUtils.createMessageElement(message);
        messagesContainer.appendChild(messageElement.firstElementChild!);
        ChatUtils.scrollToBottom(messagesContainer);
      }
    }
  }

  showError(message: string): void {
    // Create or update error notification
    let errorElement = this.container.querySelector(
      ".chat-error",
    ) as HTMLElement;
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className =
        "chat-error fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50";
      this.container.appendChild(errorElement);
    }

    errorElement.textContent = message;
    errorElement.style.display = "block";

    // Auto-hide after 3 seconds
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 3000);
  }

  clearMessageInput(): void {
    const input = this.container.querySelector(
      "#message-input",
    ) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  }

  focusMessageInput(): void {
    const input = this.container.querySelector(
      "#message-input",
    ) as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }
}

// Main component class - now focused on state management and coordination
class ChatSidebar extends HTMLElement {
  private conversations: Conversation[] = [];
  private activeConversationId: string | null = null;
  private chatManager: ChatManager;
  private currentUserId: number;
  private messageHandler: (message: ChatMessage) => void;
  private ui: ChatUI;
  private isInitialized = false;

  constructor() {
    super();
    this.chatManager = ChatManager.getInstance();
    this.currentUserId = AuthManager.getInstance().User?.id || 0;
    this.messageHandler = this.handleIncomingMessage.bind(this);
    this.ui = new ChatUI(this);
    this.initializeData();
  }

  connectedCallback(): void {
    if (!this.isInitialized) {
      this.render();
      this.setupEventListeners();
      this.setupChatManager();
      this.isInitialized = true;
    }
  }

  disconnectedCallback(): void {
    this.cleanup();
  }

  private setupChatManager(): void {
    try {
      this.chatManager.onMessage(this.messageHandler);

      if (!this.chatManager.isConnected) {
        this.chatManager.connect();
        console.log("ChatSidebar: Connected to chat manager");
      }
    } catch (error) {
      console.error("ChatSidebar: Failed to setup chat manager:", error);
      this.ui.showError("Failed to connect to chat service");
    }
  }

  private handleIncomingMessage(message: ChatMessage): void {
    try {
      console.log("Chat component received message:", message);

      // Don't process our own messages (they're already shown locally)
      if (message.senderId === this.currentUserId) {
        return;
      }

      if (message.isChannelMessage) {
        this.addMessageToRoom(message);
      } else if (message.isPrivateMessage) {
        this.addPrivateMessage(message);
      }
    } catch (error) {
      console.error("ChatSidebar: Error handling incoming message:", error);
      this.ui.showError("Error receiving message");
    }
  }

  private addMessageToRoom(message: ChatMessage): void {
    let roomConversation = this.conversations.find((c) => !c.isPrivate);

    if (!roomConversation) {
      roomConversation = this.createRoomConversation();
      this.conversations.push(roomConversation);
    }

    const newMessage = this.createMessageFromChatMessage(message, "friend");
    this.addMessageToConversation(roomConversation, newMessage);
  }

  private addPrivateMessage(message: ChatMessage): void {
    const conversationId = `private_${message.senderId}`;
    let conversation = this.conversations.find((c) => c.id === conversationId);

    if (!conversation) {
      conversation = this.createPrivateConversation(message);
      this.conversations.push(conversation);
      this.ui.updateConversationsList(
        this.conversations,
        this.activeConversationId,
      );
    }

    const newMessage = this.createMessageFromChatMessage(message, "friend");
    this.addMessageToConversation(conversation, newMessage);
  }

  private createMessageFromChatMessage(
    message: ChatMessage,
    sender: "user" | "friend",
  ): Message {
    return {
      id: message.id,
      content: message.content,
      timestamp: message.timestamp,
      sender,
      senderId: message.senderId,
      senderName: message.senderName,
    };
  }

  private createRoomConversation(): Conversation {
    return {
      id: "room",
      title: "General Chat",
      messages: [],
      lastMessage: "",
      timestamp: new Date(),
      isPrivate: false,
    };
  }

  private createPrivateConversation(message: ChatMessage): Conversation {
    return {
      id: `private_${message.senderId}`,
      title: message.senderName || `User ${message.senderId}`,
      messages: [],
      lastMessage: "",
      timestamp: new Date(),
      isPrivate: true,
      targetId: message.senderId,
    };
  }

  private addMessageToConversation(
    conversation: Conversation,
    message: Message,
  ): void {
    conversation.messages.push(message);
    conversation.lastMessage = message.content;
    conversation.timestamp = message.timestamp;

    const isActive = this.activeConversationId === conversation.id;
    this.ui.addMessageToUI(conversation.id, message, isActive);

    if (!isActive) {
      this.ui.updateConversationsList(
        this.conversations,
        this.activeConversationId,
      );
    }
  }

  private initializeData(): void {
    this.conversations = [this.createRoomConversation()];
    this.conversations[0].lastMessage = "Welcome to the chat!";
    this.activeConversationId = "room";
  }

  private async sendMessage(content: string): Promise<void> {
    if (!content.trim() || !this.activeConversationId) {
      return;
    }

    const conversation = this.conversations.find(
      (c) => c.id === this.activeConversationId,
    );
    if (!conversation) {
      this.ui.showError("Conversation not found");
      return;
    }

    try {
      let sent = false;

      if (conversation.isPrivate && conversation.targetId) {
        sent = this.chatManager.sendPrivateMessage(
          content,
          conversation.targetId,
        );
      } else {
        sent = this.chatManager.sendRoomMessage(content);
      }

      if (sent) {
        const newMessage: Message = {
          id: Date.now().toString(),
          content: content,
          timestamp: new Date(),
          sender: "user",
          senderId: this.currentUserId,
        };

        this.addMessageToConversation(conversation, newMessage);
        this.ui.clearMessageInput();
        this.ui.focusMessageInput();
      } else {
        this.ui.showError("Failed to send message");
      }
    } catch (error) {
      console.error("ChatSidebar: Error sending message:", error);
      this.ui.showError("Error sending message");
    }
  }

  private createNewChat(): void {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `Chat ${this.conversations.length + 1}`,
      messages: [],
      lastMessage: "New conversation started",
      timestamp: new Date(),
      isPrivate: false,
    };

    this.conversations.unshift(newConversation);
    this.selectConversation(newConversation.id);
  }

  private selectConversation(conversationId: string): void {
    this.activeConversationId = conversationId;
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );

    this.ui.updateActiveConversation(conversation || null);
    this.ui.updateConversationsList(
      this.conversations,
      this.activeConversationId,
    );

    setTimeout(() => this.ui.focusMessageInput(), 100);
  }

  private setupEventListeners(): void {
    // Use event delegation for better performance
    this.addEventListener("click", this.handleClick.bind(this));
    this.addEventListener("keypress", this.handleKeypress.bind(this));
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (target.closest("#toggle-sidebar")) {
      this.ui.toggleSidebar();
    } else if (target.closest("#new-chat")) {
      this.createNewChat();
    } else if (target.closest("#send-message")) {
      this.handleSendMessage();
    } else if (target.closest(".conversation-item")) {
      const conversationId = target
        .closest(".conversation-item")
        ?.getAttribute("data-conversation-id");
      if (conversationId) {
        this.selectConversation(conversationId);
      }
    }
  }

  private handleKeypress(event: KeyboardEvent): void {
    if (
      event.key === "Enter" &&
      event.target === this.querySelector("#message-input")
    ) {
      event.preventDefault();
      this.handleSendMessage();
    }
  }

  private handleSendMessage(): void {
    const input = this.querySelector("#message-input") as HTMLInputElement;
    if (input && input.value.trim()) {
      this.sendMessage(input.value.trim());
    }
  }

  private cleanup(): void {
    try {
      this.chatManager.offMessage(this.messageHandler);
      console.log("ChatSidebar: Cleaned up successfully");
    } catch (error) {
      console.error("ChatSidebar: Error during cleanup:", error);
    }
  }

  private render(): void {
    this.innerHTML = this.getTemplate();
    this.ui.updateConversationsList(
      this.conversations,
      this.activeConversationId,
    );

    const activeConversation = this.conversations.find(
      (c) => c.id === this.activeConversationId,
    );
    this.ui.updateActiveConversation(activeConversation || null);

    setTimeout(() => this.ui.focusMessageInput(), 100);
  }

  private getTemplate(): string {
    return /* html */ `
      <div class="flex h-full w-64 ">
        <div class="chat-sidebar bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ease-in-out w-80 flex flex-col">
          <div class="p-4 border-b border-sidebar-border flex items-center justify-between flex-shrink-0">
            <h1 class="text-lg font-semibold text-sidebar-foreground">Chat</h1>
            <button id="toggle-sidebar" class="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
              <svg class="w-5 h-5 text-sidebar-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7"></path>
              </svg>
            </button>
          </div>

          <div class="expanded-content flex flex-col flex-1">
            <div class="p-2 border-b border-sidebar-border flex-shrink-0">
              <button id="new-chat" class="w-full bg-sidebar-primary text-sidebar-primary-foreground rounded-md py-2 px-4 hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 text-sm">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Chat
              </button>
            </div>

            <div class="overflow-y-auto flex-shrink-0" style="max-height: 200px;" id="conversations-list">
              <!-- Conversations will be populated by UI class -->
            </div>

            <div class="flex-1 flex flex-col min-h-0" id="active-conversation">
              <!-- Active conversation will be populated by UI class -->
            </div>

            <div class="border-t border-sidebar-border p-3 flex-shrink-0">
              <div class="flex gap-2">
                <input
                  type="text"
                  id="message-input"
                  placeholder="Type your message..."
                  class="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                <button
                  id="send-message"
                  class="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center flex-shrink-0"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Register the custom element
customElements.define("chat-sidebar", ChatSidebar);
// Export for module usage
export { ChatSidebar, type Message, type Conversation };

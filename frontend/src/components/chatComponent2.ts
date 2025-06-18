interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
  senderId?: number;
  senderName?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
  isPrivate?: boolean;
  targetId?: number;
}

/**
 * ChatSidebar2 - A custom web component that provides a collapsible chat interface
 */
class ChatSidebar2 extends HTMLElement {
  // Class properties
  private isCollapsed: boolean;
  private conversations: Conversation[];
  private activeConversationId: string | null;

  // Constants
  private static readonly SCROLL_DELAY_MS = 100;
  private static readonly SVG_ICONS = {
    COLLAPSE: "M11 19l-7-7 7-7M19 19l-7-7 7-7",
    EXPAND: "M13 5l7 7-7 7M5 5l7 7-7 7",
    ADD: "M12 4v16m8-8H4",
    SEND: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
    CHAT: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  };

  /**
   * Initialize the component
   */
  constructor() {
    super();
    this.isCollapsed = false;
    this.conversations = [];
    this.activeConversationId = null;
    this.initializeData();
  }

  /**
   * Web component lifecycle method called when the element is added to the DOM
   */
  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
  }

  /**
   * Initialize sample conversation data
   */
  private initializeData(): void {
    // Sample data
    this.conversations = [
      {
        id: "1",
        title: "General Discussion",
        messages: [
          {
            id: "1",
            content: "Hello! How can I help you today?",
            timestamp: new Date(Date.now() - 3600000),
            sender: "assistant",
          },
          {
            id: "2",
            content: "I need help with my project",
            timestamp: new Date(Date.now() - 3500000),
            sender: "user",
          },
          {
            id: "3",
            content:
              "I'd be happy to help! What kind of project are you working on?",
            timestamp: new Date(Date.now() - 3400000),
            sender: "assistant",
          },
        ],
        lastMessage:
          "I'd be happy to help! What kind of project are you working on?",
        timestamp: new Date(Date.now() - 3400000),
      },
      {
        id: "2",
        title: "Technical Support",
        messages: [
          {
            id: "4",
            content: "What technical issue are you experiencing?",
            timestamp: new Date(Date.now() - 7200000),
            sender: "assistant",
          },
          {
            id: "5",
            content: "My application is running slowly",
            timestamp: new Date(Date.now() - 7100000),
            sender: "user",
          },
        ],
        lastMessage: "My application is running slowly",
        timestamp: new Date(Date.now() - 7100000),
      },
      {
        id: "3",
        title: "Feature Requests",
        messages: [
          {
            id: "6",
            content: "What new features would you like to see?",
            timestamp: new Date(Date.now() - 86400000),
            sender: "assistant",
          },
        ],
        lastMessage: "What new features would you like to see?",
        timestamp: new Date(Date.now() - 86400000),
      },
    ];

    // Set first conversation as active by default
    if (this.conversations.length > 0) {
      this.activeConversationId = this.conversations[0].id;
    }
  }

  // --------------------------
  // UI Rendering Methods
  // --------------------------

  /**
   * Render the component
   */
  private render(): void {
    this.innerHTML = this.getTemplate();
  }

  /**
   * Get the main component template
   */
  private getTemplate(): string {
    return `
      <div class="flex h-full w-screen">
        ${this.getSidebarTemplate()}
      </div>
    `;
  }

  /**
   * Get the sidebar template
   */
  private getSidebarTemplate(): string {
    return `
      <div class="bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ease-in-out ${
        this.isCollapsed ? "w-16" : "w-80"
      } flex flex-col">
        ${this.getSidebarHeaderTemplate()}
        ${this.isCollapsed ? "" : this.getExpandedSidebarContent()}
      </div>
    `;
  }

  /**
   * Get the sidebar header template
   */
  private getSidebarHeaderTemplate(): string {
    return `
      <div class="p-4 border-b border-sidebar-border flex items-center justify-between flex-shrink-0">
        ${this.isCollapsed ? "" : '<h1 class="text-lg font-semibold text-sidebar-foreground">Chat</h1>'}
        <button id="toggle-sidebar" class="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
          <svg class="w-5 h-5 text-sidebar-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
              this.isCollapsed
                ? ChatSidebar2.SVG_ICONS.EXPAND
                : ChatSidebar2.SVG_ICONS.COLLAPSE
            }"></path>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Get the expanded sidebar content template
   */
  private getExpandedSidebarContent(): string {
    return `
      ${this.getNewChatButtonTemplate()}
      ${this.getConversationsListTemplate()}
      ${this.getActiveChatTemplate()}
      ${this.getChatInputTemplate()}
    `;
  }

  /**
   * Get the new chat button template
   */
  private getNewChatButtonTemplate(): string {
    return `
      <div class="p-2 border-b border-sidebar-border flex-shrink-0">
        <button id="new-chat" class="w-full bg-sidebar-primary text-sidebar-primary-foreground rounded-md py-2 px-4 hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 text-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${ChatSidebar2.SVG_ICONS.ADD}"></path>
          </svg>
          New Chat
        </button>
      </div>
    `;
  }

  /**
   * Get the conversations list template
   */
  private getConversationsListTemplate(): string {
    return `
      <div class="overflow-y-auto flex-shrink-0" style="max-height: 200px;">
        ${this.getConversationsTemplate()}
      </div>
    `;
  }

  /**
   * Get the active chat template
   */
  private getActiveChatTemplate(): string {
    return `
      <div class="flex-1 flex flex-col min-h-0">
        ${this.activeConversationId ? this.getActiveConversationTemplate() : ""}
      </div>
    `;
  }

  /**
   * Get the chat input template
   */
  private getChatInputTemplate(): string {
    return `
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${ChatSidebar2.SVG_ICONS.SEND}"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Get the conversations template
   */
  private getConversationsTemplate(): string {
    return this.conversations
      .map((conversation) => this.renderConversationItem(conversation))
      .join("");
  }

  /**
   * Render a single conversation item
   */
  private renderConversationItem(conversation: Conversation): string {
    const isActive = this.activeConversationId === conversation.id;

    return `
      <div class="conversation-item p-2 mx-2 mb-1 rounded-md cursor-pointer transition-colors hover:bg-sidebar-accent ${
        isActive ? "bg-sidebar-accent" : ""
      }" data-conversation-id="${conversation.id}">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-3 h-3 text-sidebar-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${ChatSidebar2.SVG_ICONS.CHAT}"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-medium text-sidebar-foreground truncate text-sm">${conversation.title}</div>
            ${
              conversation.lastMessage
                ? `<div class="text-xs text-sidebar-foreground/70 truncate">${conversation.lastMessage}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get the active conversation template
   */
  private getActiveConversationTemplate(): string {
    const conversation = this.findConversationById(this.activeConversationId);
    if (!conversation) return "";

    return `
      <div class="border-b border-sidebar-border p-3 flex-shrink-0">
        <h3 class="font-medium text-sidebar-foreground text-sm">${conversation.title}</h3>
      </div>
      <div class="flex-1 overflow-y-auto p-3 space-y-3" id="messages-container">
        ${this.getMessagesTemplate(conversation.messages)}
      </div>
    `;
  }

  /**
   * Get the messages template
   */
  private getMessagesTemplate(messages: Message[]): string {
    return messages.map((message) => this.renderMessageItem(message)).join("");
  }

  /**
   * Render a single message item
   */
  private renderMessageItem(message: Message): string {
    const isUserMessage = message.sender === "user";
    const messageStyle = isUserMessage
      ? "bg-blue-500 text-white rounded-br-sm"
      : "bg-gray-100 text-gray-900 rounded-bl-sm";

    return `
      <div class="flex ${isUserMessage ? "justify-end" : "justify-start"}">
        <div class="max-w-[85%] px-3 py-2 rounded-lg text-xs ${messageStyle}">
          <p>${message.content}</p>
          <p class="text-[10px] mt-1 opacity-70">${this.formatTime(message.timestamp)}</p>
        </div>
      </div>
    `;
  }

  // --------------------------
  // Event Handling Methods
  // --------------------------

  /**
   * Attach event listeners to the component
   */
  private attachEventListeners(): void {
    // Use event delegation for better performance
    this.addEventListener("click", this.handleClickEvents.bind(this));

    // Handle key press events
    const messageInput = this.querySelector(
      "#message-input",
    ) as HTMLInputElement;
    if (messageInput) {
      messageInput.addEventListener("keypress", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          this.handleSendMessage();
        }
      });
      messageInput.focus();
    }
  }

  /**
   * Handle click events using event delegation
   */
  private handleClickEvents(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (target.closest("#toggle-sidebar")) {
      this.toggleSidebar();
    } else if (target.closest("#new-chat")) {
      this.createNewChat();
    } else if (target.closest(".conversation-item")) {
      const conversationItem = target.closest(
        ".conversation-item",
      ) as HTMLElement;
      const conversationId = conversationItem?.getAttribute(
        "data-conversation-id",
      );
      if (conversationId) {
        this.selectConversation(conversationId);
      }
    } else if (target.closest("#send-message")) {
      this.handleSendMessage();
    }
  }

  /**
   * Toggle the sidebar between expanded and collapsed states
   */
  private toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Handle sending a new message
   */
  private handleSendMessage(): void {
    const messageInput = this.querySelector(
      "#message-input",
    ) as HTMLInputElement;
    if (
      messageInput &&
      messageInput.value.trim() &&
      this.activeConversationId
    ) {
      this.addMessage(
        this.activeConversationId,
        messageInput.value.trim(),
        "user",
      );
      messageInput.value = "";
    }
  }

  // --------------------------
  // Conversation Management Methods
  // --------------------------

  /**
   * Create a new chat conversation
   */
  private createNewChat(): void {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `New Chat ${this.conversations.length + 1}`,
      messages: [
        {
          id: Date.now().toString(),
          content: "Hello! How can I assist you today?",
          timestamp: new Date(),
          sender: "assistant",
        },
      ],
      lastMessage: "Hello! How can I assist you today?",
      timestamp: new Date(),
    };

    this.conversations.unshift(newConversation);
    this.selectConversation(newConversation.id);
  }

  /**
   * Select a conversation and make it active
   */
  private selectConversation(conversationId: string): void {
    this.activeConversationId = conversationId;
    this.render();
    this.attachEventListeners();
    this.scrollToBottomOfMessages();
  }

  /**
   * Add a new message to a conversation
   */
  private addMessage(
    conversationId: string,
    content: string,
    sender: "user" | "assistant",
  ): void {
    const conversation = this.findConversationById(conversationId);
    if (!conversation) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      sender,
    };

    conversation.messages.push(newMessage);
    conversation.lastMessage = content;
    conversation.timestamp = new Date();

    this.moveConversationToTop(conversationId);
    this.render();
    this.attachEventListeners();
    this.scrollToBottomOfMessages();
  }

  /**
   * Move a conversation to the top of the list
   */
  private moveConversationToTop(conversationId: string): void {
    const index = this.conversations.findIndex((c) => c.id === conversationId);
    if (index > 0) {
      const [conv] = this.conversations.splice(index, 1);
      this.conversations.unshift(conv);
    }
  }

  /**
   * Find a conversation by its ID
   */
  private findConversationById(
    conversationId: string | null,
  ): Conversation | undefined {
    if (!conversationId) return undefined;
    return this.conversations.find((c) => c.id === conversationId);
  }

  // --------------------------
  // Utility Methods
  // --------------------------

  /**
   * Scroll to the bottom of the messages container
   */
  private scrollToBottomOfMessages(): void {
    setTimeout(() => {
      const messagesContainer = this.querySelector(
        "#messages-container",
      ) as HTMLElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, ChatSidebar2.SCROLL_DELAY_MS);
  }

  /**
   * Format a timestamp for display
   */
  private formatTime(date: Date): string {
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
}

// Register the custom element
customElements.define("chat-sidebar2", ChatSidebar2);
export { ChatSidebar2, type Message, type Conversation };

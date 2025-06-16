// Types
interface Message {
  id: string;
  content: string;
  timestamp: Date;
  sender: "user" | "assistant";
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
}

class ChatSidebar extends HTMLElement {
  private isCollapsed = false;
  private conversations: Conversation[] = [];
  private activeConversationId: string | null = null;

  constructor() {
    super();
    this.initializeData();
  }

  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
  }

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
    this.activeConversationId = this.conversations[0].id;
  }

  private render(): void {
    this.innerHTML = this.getTemplate();
  }

  private getTemplate(): string {
    return `
            <div class="flex h-full w-screen">
                <!-- Sidebar -->
                <div class="bg-sidebar-background border-r border-sidebar-border transition-all duration-300 ease-in-out ${
                  this.isCollapsed ? "w-16" : "w-80"
                } flex flex-col">
                    <!-- Header -->
                    <div class="p-4 border-b border-sidebar-border flex items-center justify-between flex-shrink-0">
                        ${this.isCollapsed ? "" : '<h1 class="text-lg font-semibold text-sidebar-foreground">Chat</h1>'}
                        <button id="toggle-sidebar" class="p-2 hover:bg-sidebar-accent rounded-md transition-colors">
                            <svg class="w-5 h-5 text-sidebar-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
                                  this.isCollapsed
                                    ? "M13 5l7 7-7 7M5 5l7 7-7 7"
                                    : "M11 19l-7-7 7-7M19 19l-7-7 7-7"
                                }"></path>
                            </svg>
                        </button>
                    </div>

                    ${this.isCollapsed ? "" : this.getExpandedSidebarContent()}
                </div>

                <!-- Empty Main Area -->
                <div class="flex-1 flex items-center justify-center bg-white">
                    <div class="text-center text-gray-400">
                        <svg class="w-24 h-24 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <p class="text-lg text-gray-300">Chat in the sidebar</p>
                    </div>
                </div>
            </div>
        `;
  }

  private getExpandedSidebarContent(): string {
    return `
            <!-- Conversations List -->
            <div class="p-2 border-b border-sidebar-border flex-shrink-0">
                <button id="new-chat" class="w-full bg-sidebar-primary text-sidebar-primary-foreground rounded-md py-2 px-4 hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 text-sm">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    New Chat
                </button>
            </div>

            <div class="overflow-y-auto flex-shrink-0" style="max-height: 200px;">
                ${this.getConversationsTemplate()}
            </div>

            <!-- Active Chat Messages -->
            <div class="flex-1 flex flex-col min-h-0">
                ${this.activeConversationId ? this.getActiveConversationTemplate() : ""}
            </div>

            <!-- Input Area -->
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
        `;
  }

  private getConversationsTemplate(): string {
    return this.conversations
      .map(
        (conversation) => `
                    <div class="conversation-item p-2 mx-2 mb-1 rounded-md cursor-pointer transition-colors hover:bg-sidebar-accent ${
                      this.activeConversationId === conversation.id
                        ? "bg-sidebar-accent"
                        : ""
                    }" data-conversation-id="${conversation.id}">
                        <div class="flex items-center gap-2">
                            <div class="w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center flex-shrink-0">
                                <svg class="w-3 h-3 text-sidebar-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
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
                `,
      )
      .join("");
  }

  private getActiveConversationTemplate(): string {
    const conversation = this.conversations.find(
      (c) => c.id === this.activeConversationId,
    );
    if (!conversation) return "";

    return `
            <!-- Chat Header -->
            <div class="border-b border-sidebar-border p-3 flex-shrink-0">
                <h3 class="font-medium text-sidebar-foreground text-sm">${conversation.title}</h3>
            </div>

            <!-- Messages Area -->
            <div class="flex-1 overflow-y-auto p-3 space-y-3" id="messages-container">
                ${this.getMessagesTemplate(conversation.messages)}
            </div>
        `;
  }

  private getMessagesTemplate(messages: Message[]): string {
    return messages
      .map(
        (message) => `
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
                `,
      )
      .join("");
  }

  private attachEventListeners(): void {
    // Toggle sidebar
    const toggleBtn = this.querySelector(
      "#toggle-sidebar",
    ) as HTMLButtonElement;
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.isCollapsed = !this.isCollapsed;
        this.render();
        this.attachEventListeners();
      });
    }

    // New chat
    const newChatBtn = this.querySelector("#new-chat") as HTMLButtonElement;
    if (newChatBtn) {
      newChatBtn.addEventListener("click", () => {
        this.createNewChat();
      });
    }

    // Conversation selection
    const conversationItems = this.querySelectorAll(
      ".conversation-item",
    ) as NodeListOf<HTMLElement>;
    conversationItems.forEach((item) => {
      item.addEventListener("click", () => {
        const conversationId = item.getAttribute("data-conversation-id");
        if (conversationId) {
          this.selectConversation(conversationId);
        }
      });
    });

    // Send message
    const sendBtn = this.querySelector("#send-message") as HTMLButtonElement;
    const messageInput = this.querySelector(
      "#message-input",
    ) as HTMLInputElement;

    const sendMessage = (): void => {
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

        // Simulate assistant response
        setTimeout(
          () => {
            if (this.activeConversationId) {
              const responses = [
                "Thanks for your message! How can I help you further?",
                "That's interesting! Tell me more about that.",
                "I understand. What would you like to know?",
                "Great question! Let me help you with that.",
                "I see what you mean. Here's what I think...",
                "Could you provide more details about that?",
                "That makes sense. What's your next step?",
                "I'm here to help! What else can I assist with?",
              ];
              const randomResponse =
                responses[Math.floor(Math.random() * responses.length)];
              this.addMessage(
                this.activeConversationId,
                randomResponse,
                "assistant",
              );
            }
          },
          1000 + Math.random() * 1000,
        );
      }
    };

    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage);
    }

    if (messageInput) {
      messageInput.addEventListener("keypress", (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          sendMessage();
        }
      });
      // Auto-focus the input
      messageInput.focus();
    }
  }

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

  private selectConversation(conversationId: string): void {
    this.activeConversationId = conversationId;
    this.render();
    this.attachEventListeners();

    // Scroll to bottom of messages
    setTimeout(() => {
      const messagesContainer = this.querySelector(
        "#messages-container",
      ) as HTMLElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  private addMessage(
    conversationId: string,
    content: string,
    sender: "user" | "assistant",
  ): void {
    const conversation = this.conversations.find(
      (c) => c.id === conversationId,
    );
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

    // Move conversation to top
    const index = this.conversations.findIndex((c) => c.id === conversationId);
    if (index > 0) {
      const [conv] = this.conversations.splice(index, 1);
      this.conversations.unshift(conv);
    }

    this.render();
    this.attachEventListeners();

    // Scroll to bottom of messages
    setTimeout(() => {
      const messagesContainer = this.querySelector(
        "#messages-container",
      ) as HTMLElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

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
customElements.define("chat-sidebar", ChatSidebar);

// Export for module usage
export { ChatSidebar, type Message, type Conversation };

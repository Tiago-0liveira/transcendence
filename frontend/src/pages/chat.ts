import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";

interface Message {
  content: string;
  timestamp: Date;
  targetId?: number;
  senderId: number;
  senderName: string;
  seen: boolean;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  lastMessage: string;
  timestamp: Date;
  isPrivate: boolean;
  // targetId?: number;
}

// Mock data for testing purposes
// State to track the current conversation

let currentConversationId: number | null = null;
// let conversations: Conversation[] = [];
let mockConversations: Conversation[] = [
  {
    id: 777888,
    title: "General Chat",
    messages: [],
    lastMessage: "",
    timestamp: new Date(Date.now()),
    isPrivate: false,
  },
];

const sh = SocketHandler.getInstance();

const chatComponent = async () => {
  const loggedInUser = AuthManager.getInstance().User!;

  //Setup socket handler;
  sh.addMessageHandler("chat-message", function (res) {
    const conversationId = res.isPrivateMessage ? res.source : 777888;
    const newMessage: Message = {
      content: res.content,
      timestamp: res.timestamp,
      senderId: res.source,
      senderName: res.sourceName,
      targetId: res.target,
      seen: false,
    };
    let conversation = mockConversations.find((c) => c.id === conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        title: res.sourceName,
        messages: [],
        lastMessage: res.content,
        timestamp: res.timestamp,
        isPrivate: res.isPrivateMessage,
      };
      mockConversations.push(conversation);
    }
    //Add the message into the conversation
    conversation.messages.push(newMessage);
    conversation.lastMessage = newMessage.content;
    conversation.timestamp = newMessage.timestamp;

    //Update UI if this the current conversation
    if (conversationId === currentConversationId) {
      renderMessages(conversation.messages, loggedInUser);
    }
    //Update conversation list
    renderConversations(loggedInUser);
  });

  const template = /* html */ `
    <div class="flex w-screen h-[calc(100vh-64px)] bg-sky-950 shadow-xl rounded-lg">
      <!-- Left Sidebar -->
      <aside class="h-full w-100 bg-teal-light p-4 flex flex-col space-y-4">
        <!-- Public Chatrooms -->
        <div class="mt-4">
          <h2 class="text-white font-bold mb-1">>- Public Chats -<</h2>
          <div id="publicChats" class="space-y-2">
            <!-- Public conversations will be rendered here -->
          </div>
        </div>

        <!-- Private Messages -->
        <div class="flex-1 overflow-y-auto mt-4">
          <h2 class="text-white font-bold mb-1 sticky top-0 bg-teal-light z-10">>- Private Messages -<</h2>
          <div id="privateChats" class="space-y-2">
            <!-- Private conversations will be rendered here -->
          </div>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="flex-1 flex flex-col bg-sky-900 relative">
        <!-- Chat Header -->
        <div id="ChatHeader" class="h-20 px-4 py-2"></div>

        <!-- Chat Messages: scrollable area -->
        <div id="messageContainer" class="flex-1 w-full flex flex-col overflow-y-auto p-6 space-y-3">
          <!-- Messages appended here -->
        </div>

        <!-- Message Input Bar -->
        <div class="p-4 bg-indigo-950">
          <div class="flex items-center max-w-screen-xl space-x-3 mx-auto">
            <input
              type="text"
              placeholder="New message ..."
              id="messageInput"
              class="flex-1 px-4 py-3 bg-cream rounded-lg border-none outline-none text-gray-700"
            />
            <button
              id="sendButton"
              class="bg-teal-dark text-white px-6 py-3 rounded-lg hover:bg-teal-custom transition-colors"
              onclick="sendMessage()"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
`;
  const appEl = document.getElementById("app");
  if (appEl) appEl.innerHTML = template;
  initChat(loggedInUser);
  return () => {
    sh.removeMessageHandler("chat-message");
  };
};

function initChat(loggedInUser: UserNoPass) {
  renderConversations(loggedInUser);

  const sendButton = document.getElementById("sendButton");
  const messageInput = document.getElementById(
    "messageInput",
  ) as HTMLInputElement;

  if (sendButton && messageInput)
    sendButton.addEventListener("click", () => {
      const message = messageInput.value.trim();
      if (message.length > 0) {
        sendMessage(loggedInUser);
        messageInput.value = "";
      }
    });

  if (messageInput) {
    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        sendMessage(loggedInUser);
      }
    });
  }
}

function renderConversations(loggedInUser: UserNoPass) {
  const publicChatsElem = document.getElementById("publicChats");
  const privateChatsElem = document.getElementById("privateChats");

  if (publicChatsElem && privateChatsElem) {
    publicChatsElem.innerHTML = "";
    privateChatsElem.innerHTML = "";

    mockConversations.forEach((conversation) => {
      const conversationElem = createConversationElem(
        conversation,
        loggedInUser,
      );
      if (conversation.isPrivate) {
        privateChatsElem.appendChild(conversationElem);
      } else {
        publicChatsElem.appendChild(conversationElem);
      }
    });
  }
}

export function newChat(loggedInUser: UserNoPass, targetUser: UserNoPass) {
  const conversationId = targetUser.id;
  let conversation: Conversation = {
    id: conversationId,
    title: targetUser.username,
    messages: [],
    lastMessage: "empty",
    timestamp: new Date(Date.now()),
    isPrivate: true,
  };
  mockConversations.push(conversation);
  //Add the message into the conversation

  //Update conversation list
  renderConversations(loggedInUser);
}

function createChatHeaderElem(conversation: Conversation): string {
  return `
        <!-- Profile Section -->
      <div class= "bg-indigo-950 px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <img
              src="../../public/42-logo.svg"
              alt="Rendy Del Rosario"
              width="48"
              height="48"
              class="rounded-full object-cover"
            />
          </div>
          <div class="flex">
            <h2 class="text-white font-medium text-lg leading-tight">${conversation.title}</h2>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <!-- Video Call Button -->
          <button class="text-white hover:bg-teal-700 h-10 w-10 rounded-full flex items-center justify-center transition-colors text-xl">
            📹<span class="sr-only">Video call</span>
          </button>

          <!-- Phone Call Button -->
          <button class="text-white hover:bg-teal-700 h-10 w-10 rounded-full flex items-center justify-center transition-colors text-xl">
            📞<span class="sr-only">Voice call</span>
          </button>
        </div>
      </div>
    `;
}

function createLastMessage(
  conversation: Conversation,
  loggedInUser: UserNoPass,
): string {
  let senderName = "";
  let joinedStr = "";
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  if (lastMessage) {
    senderName =
      lastMessage.senderId === loggedInUser.id ? "me" : lastMessage.senderName;
    joinedStr = senderName + ": " + lastMessage.content;
  }

  return joinedStr;
}

function createConversationElem(
  conversation: Conversation,
  loggedInUser: UserNoPass,
): HTMLElement {
  const convDiv = document.createElement("div");
  let dateFmt = "";

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  if (lastMessage) {
    dateFmt = formatDate(lastMessage.timestamp);
  }
  dateFmt = formatDate(new Date(Date.now()));
  const unreadCount = countUnreadMessages(conversation, loggedInUser);
  const counterClass = unreadCount > 0 ? "bg-green-500 text-white" : "bg-white";

  convDiv.innerHTML = `
    <div class="max-w-md mx-auto bg-white rounded-lg">
        <div class="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border border-gray-200 rounded-lg">
            <!-- Profile Image -->
            <img src="../../public/42-logo.svg" alt="Profile" width="48" height="48" class="rounded-full object-cover" />
            <div class="relative flex-shrink-0">
            </div>
            <!-- Message Content -->
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between mb-1">
                    <div class="min-w-0 flex-1">
                        <p class="text-gray-900 text-left font-medium text-sm mb-1">${conversation.title}</p>
                        <p class="text-gray-500 text-sm  text-left truncate">${createLastMessage(conversation, loggedInUser)}</p>
                    </div>
                    <!-- Timestamp and Unread Badge -->
                    <div class="ml-2 flex-shrink-0 flex flex-col items-end gap-1">
                    <span class="text-green-500 text-xs font-medium">${dateFmt}</span>
                    <div class="${counterClass} text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center"> ${unreadCount}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
  convDiv.addEventListener("click", () => {
    selectConversation(conversation.id, conversation, loggedInUser);
  });

  return convDiv;
}

function selectConversation(
  conversationId: number,
  conversation: Conversation,
  loggedInUser: UserNoPass,
) {
  currentConversationId = conversationId;

  const conversationItem = mockConversations.find(
    (conv) => conv.id === conversationId,
  );

  if (conversationItem) {
    markMessageAsSeen(conversation, loggedInUser);
    const titleElem = document.getElementById("conversationTitle");
    if (titleElem) {
      titleElem.textContent = conversation.title;
    }
    renderMessages(conversationItem.messages, loggedInUser);
  }
  renderConversations(loggedInUser);
  const upperChatArea = document.getElementById("ChatHeader");
  if (upperChatArea) {
    upperChatArea.innerHTML = createChatHeaderElem(conversation);
  }
}

function renderMessages(messages: Message[], loggedInUser: UserNoPass) {
  const messageContainer = document.getElementById("messageContainer");
  // const chatHeader = document.getElementById("ChatHeader");
  // if (chatHeader) {
  //   chatHeader.innerHTML = createChatHeaderElem(conversation);
  // }

  if (messageContainer) {
    messageContainer.innerHTML = "";
    messages.forEach((message) => {
      const messageElem = createMessageElem(message, loggedInUser);
      messageContainer.appendChild(messageElem);
    });

    messageContainer.scrollTop = messageContainer.scrollHeight;
  }
}

function createMessageElem(
  message: Message,
  loggedInUser: UserNoPass,
): HTMLElement {
  const msgDiv = document.createElement("div");
  let senderName;

  if (message.senderId === loggedInUser.id) {
    msgDiv.className = "self-end max-w-xs rounded-l-lg bg-green-500";
    senderName = "me";
  } else {
    msgDiv.className = "self-start max-w-xs rounded-r-lg bg-blue-500";
    senderName = message.senderName;
  }

  msgDiv.innerHTML = /* hmtl */ `
  <div class="text-white p-2 shadow-md relative">
    <!-- Message Content -->
    <div class="mb-4">
    ${message.content}
    </div>
    <!-- Footer with sender name and timestamp -->
    <div class="flex justify-between items-end text-xs opacity-75 mt-2">
      <!-- Sender name (lower left) -->
      <span class="font-medium">${senderName}</span>
      <!-- Timestamp (lower right) -->
      <span class="ml-2">${formatDate(message.timestamp)}</span>
    </div>
  </div>
  `;
  return msgDiv;
}

//Send a new message
function sendMessage(loggedInUser: UserNoPass) {
  if (!currentConversationId) {
    alert("Please select a conversation");
    return;
  }
  const messageInput = document.getElementById(
    "messageInput",
  ) as HTMLInputElement;
  if (messageInput && messageInput.value.trim()) {
    const newMessage: Message = {
      content: messageInput.value.trim(),
      timestamp: new Date(Date.now()),
      senderId: loggedInUser.id,
      senderName: loggedInUser.username,
      seen: true,
    };
    const conversation = mockConversations.find(
      (c) => c.id === currentConversationId,
    );

    if (conversation) {
      conversation.messages.push(newMessage);
      conversation.lastMessage = newMessage.content;
      conversation.timestamp = newMessage.timestamp;

      // Update UI
      renderMessages(conversation.messages, loggedInUser);
      renderConversations(loggedInUser);
      const isChatPrivate = currentConversationId === 7778888 ? false : true;
      sh.sendMessage(
        // source: number;
        // sourceName: string;
        // timestamp: Date;
        // target?: number;
        // content: string;
        // isPrivateMessage: boolean;
        {
          type: "chat-message",
          source: loggedInUser.id,
          sourceName: loggedInUser.username,
          timestamp: new Date(Date.now()),
          target: currentConversationId,
          content: messageInput.value.trim(),
          isPrivateMessage: isChatPrivate,
        } satisfies SelectSocketMessage<"chat-message">,
      );
      // Clear input
      messageInput.value = "";
    }
  }
}
function formatDate(date: Date): string {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countUnreadMessages(
  conversation: Conversation,
  loggedInUser: UserNoPass,
): number {
  return conversation.messages.filter(
    (message) => !message.seen && message.senderId !== loggedInUser.id,
  ).length;
}

function markMessageAsSeen(
  conversation: Conversation,
  loggedInUser: UserNoPass,
) {
  conversation.messages.forEach((message) => {
    if (message.senderId !== loggedInUser.id) {
      message.seen = true;
    }
  });
}
Router.getInstance().register({
  component: chatComponent,
  path: "/chat",
  guards: [authGuard],
});

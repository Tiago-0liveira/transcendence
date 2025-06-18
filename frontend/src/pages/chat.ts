import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  targetId?: number;
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

// Mock data for testing purposes
let mockConversations: Conversation[] = [
  {
    id: "1",
    title: "General Chat",
    messages: [
      {
        id: "101",
        content: "Welcome to the general chat!",
        timestamp: new Date("2023-06-15T10:00:00"),
        sender: "assistant",
        senderId: 1,
        senderName: "System",
      },
      {
        id: "102",
        content: "Hello everyone!",
        timestamp: new Date("2023-06-15T10:05:00"),
        sender: "user",
        senderId: 2,
        senderName: "Jane",
      },
    ],
    lastMessage: "Hello everyone!",
    timestamp: new Date("2023-06-15T10:05:00"),
    isPrivate: false,
  },
  {
    id: "2",
    title: "Private Chat with Bob",
    messages: [
      {
        id: "201",
        content: "Hey, how are you?",
        timestamp: new Date("2023-06-16T09:00:00"),
        sender: "user",
        senderId: 3,
        senderName: "Bob",
      },
    ],
    lastMessage: "Hey, how are you?",
    timestamp: new Date("2023-06-16T09:00:00"),
    isPrivate: true,
    targetId: 3,
  },
];

// State to track the current conversation
let currentConversationId: string | null = null;
const currentUser = AuthManager.getInstance().User!;
const chatComponet = async () => {
  const template = /* html */ `
    <div class="flex w-screen h-[calc(100vh-64px)]  bg-sky-950 shadow-xl rounded-lg">
        <!-- Left Sidebar -->
        <aside class="w-100 bg-teal-light p-4 space-y-4">
            <!-- New private message -->
            <div class="flex items-center space-x-2">
                <input
                    type="text"
                    placeholder="Search Friends"
                    class="flex-1 px-3 py-2 bg-cream rounded border-none outline-none text-gray-700"
                >
                <button class="bg-teal-dark text-white px-3 py-2 rounded hover:bg-teal-custom transition-colors">
                </button>
            </div>

            <!-- Public Chatrooms -->
            <!-- Private Messages -->

        </aside>

        <!-- Main Chat Area -->
        <main class="flex-1 flex flex-col bg-sky-900">
            <!-- Chat Messages -->
            <div class="flex-1 p-6 space-y-4 overflow-y-auto">
            </div>

            <!-- Message Input -->
            <div class="p-4 fixed bottom-0 bg-indigo-950">
                <div class="flex items-center max-w-screen-xl space-x-3">
                    <input
                        type="text"
                        placeholder="New message ..."
                        class="flex-1 px-4 py-3 bg-cream rounded-lg border-none outline-none text-gray-700"
                        id="messageInput"
                    >
                    <button
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
};

function initChat() {}

//Send a new message
function createMessageRender(message: Message) {
  const senderName =
    message.senderId === currentUser.id ? "me" : message.senderName;
  return /* hmtl */ `
  <div class="max-w-xs bg-blue-500 text-white rounded-2xl rounded-br-md p-3 shadow-md relative">
    <!-- Message Content -->
    <div class="mb-4">
    ${message.content}
    </div>
    <!-- Footer with sender name and timestamp -->
    <div class="flex justify-between items-end text-xs opacity-75 mt-2">
      <!-- Sender name (lower left) -->
      <span class="font-medium">${senderName}</span>
      <!-- Timestamp (lower right) -->
      <span class="ml-2">${message.timestamp}</span>
    </div>
  </div>
  `;
}
function sendMessage() {
  if (!currentConversationId) {
    alert("Please select a conversation");
    return;
  }
  const messageInput = document.getElementById(
    "messageInput",
  ) as HTMLInputElement;
  if (messageInput && messageInput.value.trim()) {
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput.value.trim(),
      timestamp: new Date(),
      senderId: currentUser.id,
      senderName: currentUser.displayName,
    };
    const conversation = mockConversation.find(
      (c) => c.id === currentConversationId,
    );

    if (conversation) {
      conversation.messages.push(newMessage);
      conversation.lastMessage = newMessage.content;
      conversation.timestamp = newMessage.timestamp;

      // Update UI
      renderMessages(conversation.messages);
      renderConversation();

      // Clear input
      messageInput.value = "";
    }
  }
}

Router.getInstance().register({
  component: chatComponet,
  path: "/chat",
  guards: [authGuard],
});

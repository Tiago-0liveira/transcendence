import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";
import API from "@/utils/BackendApi";

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

const chatComponet = async () => {
	const template = /* html */ `
    <div class="flex w-screen h-[calc(100vh-64px)]  bg-sky-950 shadow-xl rounded-lg">
        <!-- Left Sidebar -->
        <aside class="w-100 bg-teal-light p-4 space-y-4">
            <!-- New private message -->
            <div class="flex items-center space-x-2">
                <input 
                    type="text" 
                    placeholder="Create new room" 
                    class="flex-1 px-3 py-2 bg-cream rounded border-none outline-none text-gray-700"
                >
                <button class="bg-teal-dark text-white px-3 py-2 rounded hover:bg-teal-custom transition-colors">
                </button>
            </div>

            <!-- Public Chatrooms -->
            <div class="space-y-2">
                <div class="text-center text-teal-dark font-semibold">— Public chatrooms —</div>
                <div class="bg-teal-dark text-white rounded p-3 flex items-center justify-between cursor-pointer">
                    <div class="flex items-center space-x-2">
                        <span>#Public Room</span>
                    </div>
                    <span class="bg-white text-teal-dark rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                </div>
            </div>
            <!-- Private Messages -->
            <div class="space-y-2">
                <div class="text-center text-teal-dark font-semibold">— Private messages —</div>
                <div class="bg-cream rounded p-3 flex items-center justify-between hover:bg-cream-dark transition-colors cursor-pointer">
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-700">👤</span>
                        <span class="text-gray-700">alice</span>
                    </div>
                    <span class="bg-teal-dark text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">9</span>
                </div>
            </div>

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

Router.getInstance().register({
	component: chatComponet,
	path: "/chat",
	guards: [authGuard],
});

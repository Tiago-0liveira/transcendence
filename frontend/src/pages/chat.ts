import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards"
import API from "@/utils/BackendApi";


    
const chatComponet = async () =>
{ const template = /* html */ `
<body class="bg-teal-custom min-h-screen">
    <!-- Header -->
    <header class="bg-teal-dark text-white px-6 py-4 flex items-center justify-between">
        <h1 class="text-xl font-bold">transcendance</h1>
        <nav class="flex items-center space-x-6">
            <button class="hover:text-teal-light transition-colors">🌙</button>
            <button class="hover:text-teal-light transition-colors">🔍</button>
            <a href="#" class="hover:text-teal-light transition-colors">Home</a>
            <a href="#" class="hover:text-teal-light transition-colors">Leaderboard</a>
            <a href="#" class="text-teal-light font-semibold">Chat</a>
            <a href="#" class="hover:text-teal-light transition-colors">Play</a>
            <a href="#" class="hover:text-teal-light transition-colors">Profile</a>
            <a href="#" class="hover:text-teal-light transition-colors">Logout</a>
        </nav>
    </header>

    <div class="flex h-[calc(100vh-80px)]">
        <!-- Left Sidebar -->
        <aside class="w-80 bg-teal-light p-4 space-y-4">
            <!-- Create Channel -->
            <div class="flex items-center space-x-2">
                <input 
                    type="text" 
                    placeholder="Create new room" 
                    class="flex-1 px-3 py-2 bg-cream rounded border-none outline-none text-gray-700"
                >
                <button class="bg-teal-dark text-white px-3 py-2 rounded hover:bg-teal-custom transition-colors">
                    ➕
                </button>
            </div>

            <!-- Invites -->
            <div class="bg-cream-dark rounded p-3">
                <h3 class="font-semibold text-gray-700 mb-2">Invites</h3>
            </div>

            <!-- Public Chats -->
            <div class="bg-cream-dark rounded p-3">
                <h3 class="font-semibold text-gray-700 mb-2">Public Chats</h3>
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

            <!-- Public Chatrooms -->
            <div class="space-y-2">
                <div class="text-center text-teal-dark font-semibold">— Public chatrooms —</div>
                <div class="bg-teal-dark text-white rounded p-3 flex items-center justify-between cursor-pointer">
                    <div class="flex items-center space-x-2">
                        <span>#</span>
                        <span>DiscussPong</span>
                    </div>
                    <span class="bg-white text-teal-dark rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                </div>
                <div class="bg-cream rounded p-3 flex items-center justify-between hover:bg-cream-dark transition-colors cursor-pointer">
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-700">#</span>
                        <span class="text-gray-700">HelloWorld</span>
                    </div>
                    <span class="bg-teal-dark text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">9</span>
                </div>
            </div>
        </aside>

        <!-- Main Chat Area -->
        <main class="flex-1 flex flex-col">
            <!-- Chat Messages -->
            <div class="flex-1 p-6 space-y-4 overflow-y-auto">
                <!-- Join notification -->
                <div class="text-center text-teal-dark italic">
                    ——————— alice has joined the room ———————
                </div>

                <!-- Alice's message -->
                <div class="space-y-2">
                    <div class="text-teal-dark font-semibold">alice</div>
                    <div class="bg-teal-dark text-white rounded-lg px-4 py-2 max-w-md">
                        Hi, I like Pong what about you?
                    </div>
                </div>

                <!-- My message -->
                <div class="flex justify-end">
                    <div class="space-y-2">
                        <div class="text-right text-teal-dark font-semibold">me</div>
                        <div class="bg-teal-custom text-white rounded-lg px-4 py-2 max-w-md">
                            Pong is an awesome game originally released in 1972
                        </div>
                    </div>
                </div>

                <!-- Alice's response -->
                <div class="space-y-2">
                    <div class="text-teal-dark font-semibold">alice</div>
                    <div class="bg-teal-dark text-white rounded-lg px-4 py-2 max-w-md">
                        Did you know Allen Alcorn created it as a training exercise? Crazy right?
                    </div>
                </div>

                <!-- Bob joins -->
                <div class="text-center text-teal-dark italic">
                    ——————— bob has joined the room ———————
                </div>

                <!-- Bob's messages -->
                <div class="space-y-4">
                    <div class="space-y-2">
                        <div class="text-teal-dark font-semibold">bob</div>
                        <div class="bg-teal-dark text-white rounded-lg px-4 py-2 max-w-md">
                            Oh wow I didn't know that!
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="text-teal-dark font-semibold">bob</div>
                        <div class="bg-teal-dark text-white rounded-lg px-4 py-2 max-w-md">
                            Is this the room about Pong trivia?
                        </div>
                    </div>
                </div>

                <!-- My responses -->
                <div class="flex justify-end">
                    <div class="space-y-2">
                        <div class="text-right text-teal-dark font-semibold">me</div>
                        <div class="bg-teal-custom text-white rounded-lg px-4 py-2 max-w-md">
                            Yeah I guess that's what I should have named it
                        </div>
                    </div>
                </div>

                <div class="flex justify-end">
                    <div class="space-y-2">
                        <div class="text-right text-teal-dark font-semibold">me</div>
                        <div class="bg-teal-custom text-white rounded-lg px-4 py-2 max-w-md">
                            PongTrivia
                        </div>
                    </div>
                </div>

                <!-- Bob's final message -->
                <div class="space-y-2">
                    <div class="text-teal-dark font-semibold">bob</div>
                    <div class="bg-teal-dark text-white rounded-lg px-4 py-2 max-w-md">
                        :P
                    </div>
                </div>
            </div>

            <!-- Message Input -->
            <div class="p-4 bg-cream-dark">
                <div class="flex items-center space-x-3">
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

    <script>
        class ChatApp {
            constructor() {
                this.messages = [];
                this.currentUser = 'me';
                this.initializeEventListeners();
            }

            initializeEventListeners() {
                const messageInput = document.getElementById('messageInput');
                messageInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendMessage();
                    }
                });

                // Add click handlers for sidebar items
                this.addSidebarHandlers();
            }

            sendMessage() {
                const input = document.getElementById('messageInput');
                const message = input.value.trim();
                
                if (message) {
                    this.addMessage(this.currentUser, message);
                    input.value = '';
                    this.scrollToBottom();
                }
            }

            addMessage(user, text) {
                const chatArea = document.querySelector('.flex-1.p-6');
                const messageDiv = document.createElement('div');
                
                if (user === this.currentUser) {
                    messageDiv.className = 'flex justify-end';
                    messageDiv.innerHTML = `
                        <div class="space-y-2">
                            <div class="text-right text-teal-dark font-semibold">${user}</div>
                            <div class="bg-teal-custom text-white rounded-lg px-4 py-2 max-w-md">
                                ${this.escapeHtml(text)}
                            </div>
                        </div>
                    `;
                } else {
                    messageDiv.className = 'space-y-2';
                    messageDiv.innerHTML = `
                        <div class="text-teal-dark font-semibold">${user}</div>
                        <div class="bg-teal-dark text-white rounded-lg px-4 py-2 max-w-md">
                            ${this.escapeHtml(text)}
                        </div>
                    `;
                }
                
                chatArea.appendChild(messageDiv);
            }

            addSidebarHandlers() {
                // Add click handlers for room switching
                const rooms = document.querySelectorAll('aside .cursor-pointer');
                rooms.forEach(room => {
                    room.addEventListener('click', () => {
                        // Remove active state from all rooms
                        rooms.forEach(c => {
                            c.classList.remove('bg-teal-dark', 'text-white');
                            c.classList.add('bg-cream', 'hover:bg-cream-dark');
                        });
                        
                        // Add active state to clicked room
                        room.classList.add('bg-teal-dark', 'text-white');
                        room.classList.remove('bg-cream', 'hover:bg-cream-dark');
                    });
                });
            }

            scrollToBottom() {
                const chatArea = document.querySelector('.flex-1.p-6');
                chatArea.scrollTop = chatArea.scrollHeight;
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }
        }

        // Global function for the send button
        function sendMessage() {
            chatApp.sendMessage();
        }

        // Initialize the chat app when the page loads
        let chatApp;
        document.addEventListener('DOMContentLoaded', () => {
            chatApp = new ChatApp();
        });
`;};

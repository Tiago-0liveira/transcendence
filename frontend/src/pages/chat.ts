import AuthManager from "@/auth/authManager";
import SocketHandler from "@/auth/socketHandler";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";
import API from "@/utils/BackendApi";
import { conditionalRender } from "@/utils/conditionalRender";
import { toastHelper } from "@/utils/toastHelper";

const PUBLIC_CHAT_ID = 777888;

const DEFAULT_AVATAR = "/42-logo.svg"

interface Message {
	content: string;
	timestamp: Date;
	targetId?: number;
	senderId: number;
	senderName: string;
	seen: boolean;
	isChatPrivate: boolean;
}

interface Conversation {
	id: number;
	title: string;
	messages: Message[];
	lastMessage: string;
	timestamp: Date;
	isPrivate: boolean;
	avatarUrl: string;
	// targetId?: number;
}

// Mock data for testing purposes
// State to track the current conversation

let currentConversationId: number | null = null;
// let conversations: Conversation[] = [];
export let mockConversations: Conversation[] = [
	{
		id: PUBLIC_CHAT_ID,
		title: "General Chat",
		messages: [],
		lastMessage: "",
		timestamp: new Date(Date.now()),
		isPrivate: false,
		avatarUrl: DEFAULT_AVATAR,
	}
];

const sh = SocketHandler.getInstance();

const getInviteLobbyTemplate = (room: BasicPublicLobby) => {
	return /* html */`
		<div data-room-id="${room.id}" class="div-invite-to-room flex flex-col w-full p-2 rounded-md ${room.lobbyType === "1v1" ? "bg-gray-700" : "bg-amber-700"} hover:cursor-pointer ${room.lobbyType === "1v1" ? "hover:bg-gray-600" : "hover:bg-amber-600"} duration-200">
			<div class="flex justify-between">
				<span>${room.name}</span>
				<span>${room.lobbyType}</span>
			</div>
			<div class="flex justify-between">
				<span class="flex space-x-2">
					<span class="text-yellow-400">${room.status}</span>
				</span>
				<span class="text-green-500 flex">
					<span>${room.connectedPlayersNumber}</span>
					<span>/</span>
					<span>${room.requiredPlayers}</span>
				</span>
			</div>
		</div>
	`
}

const chatComponent = async () => {
	const loggedInUser = AuthManager.getInstance().User!;

	const template = /* html */`
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
              class="bg-teal-dark text-white px-6 py-3 rounded-lg hover:bg-teal-custom transition-colors">
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
    <div id="modal" class="hidden absolute w-full h-[calc(100%-53.33px)] z-10">
		<div class="w-full h-full opacity-90 bg-black absolute"><!-- modal backdrop -->

		</div>
		<div class="w-full h-full relative z-20 flex items-center justify-center">
			<div class="profile-card centered auth-box signup-box !self-center !max-w-3xl relative !h-[500px]">
				<div class="settings-header login-section">
					<span>Invite</span>
					<span id="invite-player-name"></span>
				</div>

				<div class="form-input-group">
					<label for="playersNumber" class="form-input-label">
						<span>Rooms the player can join: </span>
					</label>
				</div>
				
				<div id="games-loading-div" class="self-center form-input-group h-8">
					<label for="playersNumber" class="form-input-label">
						<span class="flex justify-between">Loading Games <img class="w-6 animate-spin text-blue-500" src="/loading.svg" alt=""></span>
					</label>
				</div>
				<form id="form-invite-games" class="settings-form space-y-5 relative h-96 overflow-y-auto">
				</form>
				
				<button type="submit" id="btn-close-modal" class="absolute top-0 right-0 m-2 !p-2 !bg-gray-400 rounded-md !text-black hover:!text-white btn-steam-fixed"><img src="/notifications/error-circle.svg" class="w-7" alt="X svg"></button>
			</div>
		</div>
	</div>
`;
	const appEl = document.getElementById("app");
	if (appEl) appEl.innerHTML = template;

	
	const sendButton = document.getElementById("sendButton");
	const messageInput = document.querySelector<HTMLInputElement>("#messageInput");
	const closeModalButton = document.getElementById("btn-close-modal")
	const modal = document.getElementById("modal")
	const gamesLoadingDiv = document.getElementById("games-loading-div")
	const invitePlayerNameSpan = document.querySelector("span#invite-player-name")
	const formInviteGames = document.querySelector("form#form-invite-games")
	
	if (!sendButton) { throw new Error("Could not find #sendButton"); }
	if (!messageInput) { throw new Error("Could not find #messageInput"); }
	if (!closeModalButton) { throw new Error("Could not find #btn-close-modal"); }
	if (!modal) { throw new Error("Could not find #modal"); }
	if (!gamesLoadingDiv) { throw new Error("Could not find #games-loading-div"); }
	if (!invitePlayerNameSpan) { throw new Error("Could not find span#invite-player-name"); }
	if (!formInviteGames) { throw new Error("Could not find form#form-invite-games"); }
	
	
	const sendButtonHandler = () => {
		const message = messageInput.value.trim();
		if (message.length > 0) {
			sendMessage(loggedInUser);
			messageInput.value = "";
		}
	}
	const keyPressHandler = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			sendMessage(loggedInUser);
		}
	}

	const closeModal = () => {
		if (!modal.classList.contains("hidden")) {
			modal.classList.add("hidden")
		}
	}
	const closeModalButtonHandler = (e: MouseEvent) => {
		e.preventDefault()
		closeModal()
	}
	const clicksHandler = (ev: MouseEvent) => {
		if (!ev.target || !(ev.target instanceof Element)) return;
		
		const btnInviteToGame = ev.target.closest("button#btn-invite-to-game");
		if (btnInviteToGame instanceof HTMLButtonElement) {
			const targetIdStr = btnInviteToGame.dataset.targetId
			if (targetIdStr === undefined) throw new Error("targetId is undefined on button#btn-invite-to-game");
			try {
				const targetId = Number(targetIdStr)
				if (targetId !== undefined) {
					const conversation = mockConversations.find(
						(conv) => conv.id === targetId,
					);
					if (conversation) {
						invitePlayerNameSpan.textContent = conversation.title;
						modal.dataset.targetId = String(conversation.id)
						if (modal.classList.contains("hidden")) {
							modal.classList.remove("hidden")
						}
						AuthManager.getInstance().authFetch(API.games.rooms, { method: "POST", body: JSON.stringify({ targetId }) }).then((res => {
							if (res) {
								res.json().then((jsonRes) => {
									if (jsonRes && jsonRes.rooms) {
										if (!gamesLoadingDiv.classList.contains("hidden")) {
											gamesLoadingDiv.classList.add("hidden")
										}
										formInviteGames.innerHTML = ""
										jsonRes.rooms.forEach((room: BasicPublicLobby) => {
											formInviteGames.innerHTML += getInviteLobbyTemplate(room)
										});
									}
								})
							}
						})).catch((err) => {
							if (err) {
								console.warn(err)
							}
						})
					}
				}
			} catch (error) {
				console.warn(error)
			}
		}
		const divInviteToGame = ev.target.closest("div.div-invite-to-room")
		if (divInviteToGame instanceof HTMLDivElement) {
			const roomId = divInviteToGame.dataset.roomId
			const targetId = modal.dataset.targetId
			if (roomId && targetId) {
				try {
					sh.sendMessage({
						type: "chat-invite-to-game",
						roomId, target: Number(targetId)
					} satisfies SelectSocketMessage<"chat-invite-to-game">)
					closeModal()
					toastHelper.success("Success")
				} catch (error) {
				}
			}
		}
		const newChatFromPublicBtn = ev.target.closest("button#newChatFromPublicBtn")
		if (newChatFromPublicBtn instanceof HTMLButtonElement){
			ev.preventDefault();
			const userId = newChatFromPublicBtn.dataset.userId
			if (userId){	

				const loggedInUser = AuthManager.getInstance().User;
				if (!loggedInUser) {
				  return;
				}
			
				// Find the user card to get the display name
				AuthManager.getInstance().authFetch(`${API.profile}/${userId}`, {method: "GET"})
					.then(res => {
						if (res){
							res.json().then(data => {
								const userData = data.result.stats as { 
									avatarUrl: string
									displayName: "Adilson#2"
									userId: 2
								}
							
								console.log(data, userData)
								// Check if conversation already exists
								const existingConversation = mockConversations.find(
									(c) => c.id === userData.userId && c.isPrivate,
								);
							
								if (!existingConversation) {
									// Only create a new conversation if it doesn't exist
									newChat(loggedInUser, {id: userData.userId, username: userData.displayName, avatarUrl: userData.avatarUrl})
								}
							
								// Navigate to the chat page
								Router.getInstance().navigate("/chat");
							
								// Find the conversation (whether it was just created or already existed)
								const conversation = mockConversations.find((c) => c.id === userData.userId);
								console.log(conversation)
								/* currentConversationId = conversation.id */
								// If the conversation exists, select it
								if (conversation) {
									setTimeout(() => {
										selectConversation(conversation.id, conversation, loggedInUser);
									}, 100); // Small delay to ensure the chat component has loaded
								}
							}) 
						}
					}).catch(err => {
						toastHelper.warning("Could not fetch user!")
					})
				
			}
		}
	}
	
	sendButton.addEventListener("click", sendButtonHandler);
	messageInput.addEventListener("keypress", keyPressHandler);
	closeModalButton.addEventListener("click", closeModalButtonHandler)
	document.addEventListener("click", clicksHandler)
	
	sh.addMessageHandler("chat-message", function (res) {
		let conversationId;
		let conversationAvatarUrl;

		if (res.isPrivateMessage) {
			// For private messages, we need to determine if we're the sender or receiver
			if (res.source === loggedInUser.id) {
				// We're the sender, use the recipient's ID (target) as the conversation ID
				conversationId = res.target;
				// We don't set avatarUrl here - will use what's in existing conversation
			} else {
				// We're the receiver, use the sender's ID as the conversation ID
				conversationId = res.source;
				conversationAvatarUrl = res.sourceAvatarUrl; // Use sender's avatar
			}
		} else {
			// For public messages, always use the PUBLIC_CHAT_ID
			conversationId = PUBLIC_CHAT_ID;
			conversationAvatarUrl = DEFAULT_AVATAR; // Default avatar for public chat
		}

		const newMessage: Message = {
			content: res.content,
			timestamp: res.timestamp,
			senderId: res.source,
			senderName: res.sourceName,
			targetId: res.target,
			seen: res.source === loggedInUser.id ? true : false,
			isChatPrivate: res.isPrivateMessage,
		};

		let conversation = mockConversations.find((c) => c.id === conversationId);
		if (!conversation) {
			// Create new conversation
			conversation = {
				id: conversationId,
				title: res.source === loggedInUser.id ? res.targetName : res.sourceName,
				messages: [],
				lastMessage: res.content,
				timestamp: res.timestamp,
				isPrivate: res.isPrivateMessage,
				avatarUrl: conversationAvatarUrl || DEFAULT_AVATAR, // Provide default if not available
			};
			mockConversations.push(conversation);
		}
		// Update avatar if needed (for private messages from others)
		else if (
			res.isPrivateMessage &&
			res.source !== loggedInUser.id &&
			res.sourceAvatarUrl
		) {
			conversation.avatarUrl = res.sourceAvatarUrl;
		}

		// Always add the message to the conversation
		conversation.messages.push(newMessage);
		conversation.lastMessage = newMessage.content;
		conversation.timestamp = newMessage.timestamp;

		// Update UI if this the current conversation
		if (conversationId === currentConversationId) {
			renderMessages(conversation.messages, loggedInUser);
		}
		// Update conversation list
		renderConversations(loggedInUser);
	});
	renderConversations(loggedInUser);
	
	return () => {
		sh.removeMessageHandler("chat-message");
		sendButton.removeEventListener("click", sendButtonHandler);
		messageInput.removeEventListener("keypress", keyPressHandler);
		closeModalButton.removeEventListener("click", closeModalButtonHandler)
		document.removeEventListener("click", clicksHandler)
	};
};

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

export function newChat(
	loggedInUser: UserNoPass,
	targetUser: { id: number; username: string; avatarUrl?: string },
) {
	const conversationId = targetUser.id;
	let conversation: Conversation = {
		id: conversationId,
		title: targetUser.username,
		messages: [],
		lastMessage: "empty",
		timestamp: new Date(Date.now()),
		isPrivate: true,
		avatarUrl: targetUser.avatarUrl || DEFAULT_AVATAR,
	};
	mockConversations.push(conversation);
	//Add the message into the conversation

	//Update conversation list
	renderConversations(loggedInUser);
}

function createChatHeaderElem(conversation: Conversation): string {
	let conversationTitle;

	if (conversation.id === 777888){
		conversationTitle = `
			<h2 class="text-white font-medium text-lg leading-tight">${conversation.title}</h2>
		`;
	}
	else {
		conversationTitle = `
			<a href= "/profile/${conversation.id}"
			class= "hover:underline"
			><h2 class="text-white font-medium text-lg leading-tight">${conversation.title}</h2></a>
		`;
	}
	return /* html */`
        <!-- Profile Section -->
      <div class= "bg-indigo-950 px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="relative">
            <img
              src="${conversation.avatarUrl}"
              alt=""
              width="48"
              height="48"
              class="rounded-full object-cover"
            />
          </div>
          <div class="flex">
			${conversationTitle}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
			${conditionalRender(conversation.id !== PUBLIC_CHAT_ID, /* html */`
				<button id="btn-invite-to-game" data-target-id="${conversation.id}" class="text-white hover:bg-teal-700 h-10 w-10 rounded-full flex items-center justify-center transition-colors text-xl">
					📹<span class="sr-only">Video call</span>
				</button>
			`)}
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

	const avatarUrl =
		conversation.isPrivate && conversation.avatarUrl
			? conversation.avatarUrl
			: DEFAULT_AVATAR;

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
            <img src="${avatarUrl}" alt="Profile" width="48" height="48" class="rounded-full object-cover" />
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

export function selectConversation(
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
		senderName = `<span class="font-medium">me</span>`;
	} else {
		msgDiv.className = "self-start max-w-xs rounded-r-lg bg-blue-500";
		if (!message.isChatPrivate){
		senderName = `<button id="newChatFromPublicBtn" data-user-id=${message.senderId} type="button" class="hover:underline font-medium">${message.senderName}</button>`;
		} else {
			senderName = `<span class="font-medium">${message.senderName}</span>`;
		}
	}

	msgDiv.innerHTML = /* html */ `
  <div class="text-white p-2 shadow-md relative">
    <!-- Message Content -->
    <div class="text-left mb-4 break-all">
    ${message.content}
    </div>
    <!-- Footer with sender name and timestamp -->
    <div class="flex justify-between items-end text-xs opacity-75 mt-2">
      <!-- Sender name (lower left) -->
	   ${senderName}
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
		const content = messageInput.value.trim();
		const conversation = mockConversations.find(
			(c) => c.id === currentConversationId,
		);

		if (conversation) {
			const isChatPrivate = currentConversationId !== PUBLIC_CHAT_ID;

			const newMessage: Message = {
				content: content,
				timestamp: new Date(Date.now()),
				senderId: loggedInUser.id,
				senderName: loggedInUser.username,
				seen: true,
				isChatPrivate: isChatPrivate,
			};
			if (isChatPrivate) {
				newMessage.targetId = currentConversationId;
			}
			conversation.messages.push(newMessage);
			conversation.lastMessage = newMessage.content;
			conversation.timestamp = newMessage.timestamp;

			// Update UI
			requestAnimationFrame(() => {
				renderMessages(conversation.messages, loggedInUser);
				renderConversations(loggedInUser);
			});
			const msg = {
				type: "chat-message",
				source: loggedInUser.id,
				sourceName: loggedInUser.username,
				sourceAvatarUrl: loggedInUser.avatarUrl,
				timestamp: new Date(Date.now()),
				target: isChatPrivate ? currentConversationId : PUBLIC_CHAT_ID,
				targetName: isChatPrivate ? conversation.title : "Public Chat",
				content: content,
				isPrivateMessage: isChatPrivate,
			} satisfies SelectSocketMessage<"chat-message">;
			sh.sendMessage(msg);
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

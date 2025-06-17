import AuthManager from "@/auth/authManager";
import API from "@/utils/BackendApi";
import { conditionalRender } from "@/utils/conditionalRender";
import BaseAttributeValidationElement from "@component/BaseAttributeValidationElement";

type ButtonClassId = "accept" | "cancel" | "add" | "reject" | "remove" | "block" | "message";

const buttonColorsMap: Record<ButtonClassId, string> = {
	accept: "bg-green-700",
	cancel: "bg-red-700",
	add: "bg-green-700",
	reject: "bg-red-700",
	remove: "bg-red-700",
	block: "bg-yellow-600",
	message: "bg-blue-600"
};

const getButtonElement = (id: string, classId: ButtonClassId, text: string) => {
	const buttonId = `${classId}-button`
	const buttonColor = buttonColorsMap[classId]

	let iconMarkup = text;

	if (classId === "message") {
		iconMarkup = `
			<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
				viewBox="0 0 24 24" class="w-5 h-5">
				<path d="M1.5 5.25A2.25 2.25 0 013.75 3h16.5a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0120.25 21H3.75A2.25 2.25 0 011.5 18.75V5.25Zm1.842.422a.75.75 0 00-.092 1.056l8.25 9a.75.75 0 001.1 0l8.25-9a.75.75 0 10-1.1-1.02L12 14.331 3.65 5.708a.75.75 0 00-1.057-.036Z"/>
			</svg>
		`;
	} else if (classId === "remove") {
		iconMarkup = `
			<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"
				viewBox="0 0 24 24" class="w-5 h-5">
				<path d="M6 7h12v12.75A2.25 2.25 0 0115.75 22H8.25A2.25 2.25 0 016 19.75V7Zm9.25-3a1 1 0 01.92.606l.326.722H19a1 1 0 110 2h-1v1H6V6H5a1 1 0 110-2h2.504l.326-.722A1 1 0 019.25 4h5.5Z"/>
			</svg>
		`;
	}

	return `
		<button data-user-id="${id}" id="${buttonId}" class="${buttonColor} rounded-md font-semibold p-1 text-xs flex items-center justify-center gap-1">
			${iconMarkup}
		</button>
	`
}

class UserCard extends BaseAttributeValidationElement<UserCardAttributes> {
	constructor() {
		super();
	}

	static getAttributesValidators() {
		return super.defineValidator<UserCardAttributes>({
			variant: { values: ["possibleFriend", "friend", "blocked"]},
			"user-id": { },
			"avatar-url": { },
			"display-name": { },
			"is-pending": { required: false, conditional: { variant: "possibleFriend" } },
			"has-invited-me": { required: false, conditional: { variant: "possibleFriend" } },
			"online": { required: false, conditional: { variant: "friend" } }
		});
	}

	render() {
		const variant = this.getAttribute("variant")!;
		const user = {
			id: this.getAttribute("user-id")!,
			avatarUrl: this.getAttribute("avatar-url")!,
			displayName: this.getAttribute("display-name")!,
			isPending: this.getAttribute("is-pending")! === "1",
			hasInvitedMe: this.getAttribute("has-invited-me")! === "1",
			isOnline: this.getAttribute("online")! === 'true'
		}

		console.log("user", user)

		// Profile Card
		this.innerHTML = /* html */`
		<div class="flex flex-col items-center bg-slate-700 text-white rounded-md overflow-hidden w-full max-w-xs pb-4">
			<img 
				class="w-40 h-40 object-cover rounded-md mt-0" 
				src="${user.avatarUrl}" 
				alt="Avatar"
			>

			<div class="w-full px-4 mt-3">
				<div 
					class="text-left text-xl font-semibold break-words mb-3"
					${user.displayName.length > 10 ? `title="${user.displayName}"` : ""}
				>
					${user.displayName.length > 10 ? user.displayName.slice(0, 10) + '…' : user.displayName}
				</div>

				${conditionalRender(variant === "possibleFriend", `
					<div class="flex items-center gap-6 w-full">
						<div class="flex gap-2">
							${conditionalRender(user.isPending, getButtonElement(user.id, "cancel", "Cancel"))}
							${conditionalRender(user.hasInvitedMe, `
								${getButtonElement(user.id, "accept", "Accept")}
								${getButtonElement(user.id, "reject", "Reject")}
							`)}
							${conditionalRender(!user.isPending && !user.hasInvitedMe, getButtonElement(user.id, "add", "Request"))}
						</div>
				
						${conditionalRender(user.isPending, `
							<span id="pending-indicator" class="text-amber-400 text-sm font-semibold flex items-center">
								Pending<span id="pending-dots">.</span>
							</span>
						`)}
					</div>
				`)}
				${conditionalRender(variant === "friend", `
					<div class="w-full px-2 mt-3 flex flex-col justify-between grow relative min-h-[20px]">
						<div class="flex items-center justify-between mt-auto">
							<!-- Статус -->
							<span class="text-sm font-semibold ${user.isOnline ? 'text-green-400' : 'text-gray-400'}">
								${user.isOnline ? 'Online' : 'Offline'}
							</span>
				
							<!-- Кнопки -->
							<div class="flex gap-2 items-center">
								${conditionalRender(user.isOnline, getButtonElement(user.id, "message", "Message"))}
								${getButtonElement(user.id, "remove", "Remove")}
							</div>
						</div>
					</div>
				`)}


				${conditionalRender(variant === "blocked", `
					<div class="flex gap-2 w-full pr-6 relative">
						<div class="flex gap-2">
							${getButtonElement(user.id, "accept", "Accept")}
						</div>
						<div class="absolute bottom-0 right-0">
							${getButtonElement(user.id, "remove", "Unblock")}
						</div>
					</div>
				`)}
			</div>
		</div>`;

		const dotsEl = this.querySelector("#pending-dots");
		if (dotsEl) {
			let count = 0;
			setInterval(() => {
				count = (count + 1) % 4;
				dotsEl.textContent = '.'.repeat(count);
			}, 500);
		}
	}
}

const RemoveFriendHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(API.auth.friends.remove, {
		method: "POST",
		body: JSON.stringify({ userId }),
	}).then(res => {
		res?.json().then((data: { error?: string }) => {
			if (data.error) {
				console.error("Error removing friend", data.error)
				return
			}
			const playerCardEl: UserCard | null = document.querySelector(`user-card#user-id-${userId}`)
			if (playerCardEl)
			{
				playerCardEl.hidden = true;
			}
		})
	}).catch(err => {
		console.error("Error removing friend", err)
	})
}

const AddFriendHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(API.auth.friends.add, {
		method: "POST",
		body: JSON.stringify({ userId }),
	}).then(res => {
		res?.json().then((data: { error?: string }) => {
			if (data.error) {
				console.error("Error adding friend", data.error);
				return;
			}
			const playerCardEl: UserCard | null = document.querySelector(`user-card#user-id-${userId}`)
			if (playerCardEl)
			{
				playerCardEl.setAttribute("is-pending", "1")
			}
		});
	}).catch(err => {
		console.error("Error adding friend", err);
	});
};

const CancelFriendRequestHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(API.auth.friends.requests.pending.cancel, {
		method: "POST",
		body: JSON.stringify({ userId }),
	}).then(res => {
		res?.json().then((data: { error?: string }) => {
			if (data.error) {
				console.error("Error removing friend", data.error)
				return
			}
			const playerCardEl: UserCard | null = document.querySelector(`user-card#user-id-${userId}`)
			if (playerCardEl)
			{
				playerCardEl.setAttribute("is-pending", "0")
			}
		})
	}).catch(err => {
		console.error("Error Canceling friend request", err)
	})
}

const AcceptFriendRequestHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(API.auth.friends.requests.accept, {
		method: "POST",
		body: JSON.stringify({ userId }),
	}).then(res => {
		res?.json().then((data: { error?: string }) => {
			if (data.error) {
				console.error("Error accepting friend request", data.error)
				return
			}
			const playerCardEl: UserCard | null = document.querySelector(`user-card#user-id-${userId}`)
			if (playerCardEl)
			{
				playerCardEl.setAttribute("has-invited-me", "0")
				playerCardEl.setAttribute("variant", "profile")
			}
		})
	}).catch(err => {
		console.error("Error Accepting friend request", err)
	})
}

const RejectFriendRequestHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(API.auth.friends.requests.reject, {
		method: "POST",
		body: JSON.stringify({ userId }),
	}).then(res => {
		res?.json().then((data: { error?: string }) => {
			if (data.error) {
				console.error("Error rejecting friend request", data.error)
				return
			}
			const playerCardEl: UserCard | null = document.querySelector(`user-card#user-id-${userId}`)
			if (playerCardEl)
			{
				playerCardEl.hidden = true
			}
		})
	}).catch(err => {
		console.error("Error Rejecting friend request", err)
	})
}

const UnblockUserHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(API.auth.friends.remove, {
		method: "POST", // или DELETE — зависит от твоего бекенда
		body: JSON.stringify({ userId }),
	}).then(res => {
		res?.json().then((data: { error?: string }) => {
			if (data.error) {
				console.error("Error unblocking user", data.error);
				return;
			}
			const card: UserCard | null = document.querySelector(`user-card#blocked-user-id-${userId}`);
			if (card) {
				card.hidden = true;
			}
		});
	}).catch(err => {
		console.error("Error unblocking user", err);
	});
};

const getButtonAndHandleClick = (e: MouseEvent, classId: ButtonClassId, cb: (userId: string) => void) => {
	if (!e.target) return;
	if (!(e.target instanceof Element)) return;
	
	const button = e.target.closest(`#${classId}-button`)
	if (button && button instanceof HTMLButtonElement) {
		const userId = button.dataset.userId
		if (userId) {
			cb(userId)
		}
	}
}

document.addEventListener("click", (e) => {
	getButtonAndHandleClick(e, "accept", (userId) => {
		console.log("Accept userId: ", userId)
		AcceptFriendRequestHandler(userId)
	})
	getButtonAndHandleClick(e, "reject", (userId) => {
		console.log("Block userId: ", userId)
		RejectFriendRequestHandler(userId)
	})
	getButtonAndHandleClick(e, "cancel", (userId) => {
		console.log("Cancel userId: ", userId)
		CancelFriendRequestHandler(userId)
	})
	getButtonAndHandleClick(e, "add", (userId) => {
		console.log("Add userId: ", userId)
		AddFriendHandler(userId)
	})
	getButtonAndHandleClick(e, "remove", (userId) => {
		console.log("Remove/Unblock userId: ", userId);
		const card = document.querySelector(`user-card#user-id-${userId}`) ??
			document.querySelector(`user-card#blocked-user-id-${userId}`);

		const isBlocked = card?.getAttribute("variant") === "blocked";
		if (isBlocked) {
			console.log("→ Unblocking user...");
			UnblockUserHandler(userId);
		} else {
			console.log("→ Removing friend...");
			RemoveFriendHandler(userId);
		}
	});
	getButtonAndHandleClick(e, "message", (userId) => {
		console.log("Message userId: ", userId);
		window.location.href = `/chat/${userId}`; // или Router.getInstance().navigate(...)
	});

})

customElements.define("user-card", UserCard);
export default UserCard;
import AuthManager from "@/auth/authManager";
import API from "@/utils/BackendApi";
import { conditionalRender } from "@/utils/conditionalRender";
import BaseAttributeValidationElement from "@component/BaseAttributeValidationElement";

type ButtonClassId = "accept" | "cancel" | "add" | "reject" | "remove"

const buttonColorsMap: Record<ButtonClassId, string> = {
	accept: "bg-green-700",
	cancel: "bg-red-700",
	add: "bg-green-700",
	reject: "bg-red-700",
	remove: "bg-red-700"
}

const getButtonElement = (id: string, classId: ButtonClassId, text: string) => {
	const buttonColor = buttonColorsMap[classId] || "bg-gray-500";
	return `
		<button 
			data-user-id="${id}" 
			id="${classId}-button" 
			class="btn-friend-action ${buttonColor} text-white rounded-md font-semibold text-xs px-2 py-1 w-24 text-center"
		>${text}</button>
	`;
};

class UserCard extends BaseAttributeValidationElement<UserCardAttributes> {
	constructor() {
		super();
	}

	static getAttributesValidators() {
		return super.defineValidator<UserCardAttributes>({
			variant: { values: ["profile", "possibleFriend", "friend"]},
			"user-id": { },
			"avatar-url": { },
			"display-name": { },
			"is-pending": { required: false, conditional: { variant: "possibleFriend" } },
			"has-invited-me": { required: false, conditional: { variant: "possibleFriend" } },
			/*"online": { required: false, conditional: { variant: "profile" } }*/
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
			isOnline: false
		};

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
			const playerCardEl: UserCard | null = document.querySelector(`user-card#user-id-${userId}`);
			if (playerCardEl) {
				playerCardEl.setAttribute("is-pending", "1");
				playerCardEl.render(); // 👈 ДОБАВЛЕНО
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
		console.log("Remove userId: ", userId)
		RemoveFriendHandler(userId)
	})
})

customElements.define("user-card", UserCard);
export default UserCard;
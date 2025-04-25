import AuthManager from "@/auth/authManager";
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
	const buttonId = `${classId}-button`
	const buttonColor = buttonColorsMap[classId]

	return `
		<button data-user-id="${id}" id="${buttonId}" class="${buttonColor} self-end rounded-md font-semibold p-0.5 px-1 text-xs">
			${text}
		</button>
	`
}

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
		}

		this.innerHTML = `
			<div class="player-card max-w-70 max-h-16 rounded-md bg-slate-700 p-2 flex gap-3">
				<img class="aspect-auto rounded-md w-12" src=${user.avatarUrl}>
				<div class="player-content flex flex-col w-full">
					<div class="player-info text-left flex-[1] overflow-hidden">
						<span class="text-1xl self-start break-words block">
							${user.displayName}
						</span>
					</div>
					<div class="player-buttons max-h-16 flex w-full">
						<div class="badges flex flex-row gap-2 w-[40%]">
							${conditionalRender(["profile", "friend"].includes(variant), `
								<span class="badge text-left ${conditionalRender(user.isOnline, `bg-green-500`, `bg-red-500`)}">
									${conditionalRender(user.isOnline, `Online`, `Offline`)}
								</span>
							`)}
							${conditionalRender(user.isPending, `
								<span class="badge self-start bg-amber-500">
									Pending
								</span>
							`)}
							${conditionalRender(user.hasInvitedMe, `
								<span class="badge self-start bg-blue-400">
									Invited me
								</span>
							`)}
						</div>
						<div class="buttons flex flex-row gap-2 w-[60%] justify-end">
							${conditionalRender(variant === "possibleFriend", `
								${conditionalRender(user.isPending, getButtonElement(user.id, "cancel", "Cancel"))}
								${conditionalRender(user.hasInvitedMe, `
									${getButtonElement(user.id, "accept", "Accept")}
									${getButtonElement(user.id, "reject", "Reject")}
								`)}
								${conditionalRender(!user.isPending && !user.hasInvitedMe, `
									${getButtonElement(user.id, "add", "Request")}
								`)}
							`)}
							${conditionalRender(variant === "friend", getButtonElement(user.id, "remove", "Remove"))}
						</div>
					</div>
				</div>
			</div>
	  	`;
	}
}

const RemoveFriendHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(`/auth/friends/remove`, {
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
	AuthManager.getInstance().authFetch(`/auth/friends/add`, {
		method: "POST",
		body: JSON.stringify({ userId }),
	}).then(res => {
		res?.json().then((data: { error?: string }) => {
			if (data.error) {
				console.error("Error adding friend", data.error)
				return
			}
			const playerCardEl: UserCard | null = document.querySelector(`user-card#user-id-${userId}`)
			if (playerCardEl)
			{
				playerCardEl.setAttribute("is-pending", "1")
			}
		})
	}).catch(err => {
		console.error("Error adding friend", err)
	})
}

const CancelFriendRequestHandler = (userId: string) => {
	AuthManager.getInstance().authFetch(`/auth/friends/requests/pending/cancel`, {
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
	AuthManager.getInstance().authFetch(`/auth/friends/requests/accept`, {
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
	AuthManager.getInstance().authFetch(`/auth/friends/requests/reject`, {
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
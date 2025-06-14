import AuthManager from "@/auth/authManager";
import Toastify from "toastify-js";
import API from "./BackendApi";

const DURATION = 5000;

const defaultToastOptions: Toastify.Options = {
	duration: DURATION,
	gravity: "top",
	position: "right",
	stopOnFocus: true,
	close: true,
	style: {
		display: "flex",
		alignItems: "center",
		fontSize: "20px",
		borderRadius: "8px",
		padding: "10px",
		margin: "10px",
		marginTop: "50px",
	},
} as const;

const toastifyRequestResultHandler = (ev: MouseEvent, text: string) => {
	if (!ev.target || !(ev.target instanceof HTMLButtonElement)) return;
	const parent = ev.target.parentElement; /* div.buttons */
	if (!parent) return;
	const grandParent = parent.parentElement; /* div.top-content */
	if (!grandParent) return;

	const toastText = grandParent.querySelector("span");
	if (!toastText) return;

	parent.style.display = "none";
	toastText.textContent = text;
};

const toastifyRequestAccept = (userId: number) => (ev: MouseEvent) => {
	AuthManager.getInstance()
		.authFetch(API.auth.friends.requests.accept, {
			method: "POST",
			body: JSON.stringify({ userId }),
		})
		.then((res) => {
			res?.json().then((data: { error?: string }) => {
				if (data.error) {
					console.error("Error accepting friend request", data.error);
					toastifyRequestResultHandler(
						ev,
						"Error accepting the friend request!",
					);
					return;
				}
				toastifyRequestResultHandler(ev, "You accepted the friend request!");
			});
		})
		.catch((err) => {
			console.error("Error Accepting friend request", err);
			toastifyRequestResultHandler(ev, "Error accepting the friend request!");
		});
};

const toastifyRequestReject = (userId: number) => (ev: MouseEvent) => {
	AuthManager.getInstance()
		.authFetch(API.auth.friends.requests.reject, {
			method: "POST",
			body: JSON.stringify({ userId }),
		})
		.then((res) => {
			res?.json().then((data: { error?: string }) => {
				if (data.error) {
					console.error("Error rejecting friend request", data.error);
					toastifyRequestResultHandler(
						ev,
						"Error rejecting the friend request!",
					);
					return;
				}
				toastifyRequestResultHandler(ev, "You rejected the friend request!");
			});
		})
		.catch((err) => {
			console.error("Error Rejecting friend request", err);
			toastifyRequestResultHandler(ev, "Error rejecting the friend request!");
		});
};

const deployToast = (text: string, options: Toastify.Options) => {
	Toastify({
		text: text,
		...defaultToastOptions,
		...options,
		style: {
			...defaultToastOptions.style,
			...options.style,
		},
	}).showToast();
};

export const toastHelper = {
	success: (message: string) => {
		deployToast(message, {
			avatar: "/notifications/success-circle.svg",
			className: "success",
			style: {
				background: "green",
			},
		});
	},

	error: (message: string) => {
		deployToast(message, {
			avatar: "/notifications/error-circle.svg",
			className: "error",
			style: {
				background: "red",
			},
		});
	},

	info: (message: string) => {
		deployToast(message, {
			className: "info",
			avatar: "/notifications/info-circle.svg",
			style: {},
		});
	},

	warning: (message: string) => {
		deployToast(message, {
			avatar: "/notifications/warning-circle.svg",
			className: "warning",
			style: {
				background: "orange",
			},
		});
	},

	friendOnline: (name: string, avatar: string) => {
		deployToast(`${name} is now online!`, {
			avatar,
			className: "friendOnline",
		});
	},

	friendRequest: (name: string, avatar: string, friendId: number) => {
		const div = document.createElement("div");
		div.classList.add("content");
		div.innerHTML = /* html */ `
			<div class="top-content flex items-center">
				<img src="${avatar}" class="toastify-avatar mr-1">
				<span class="text-lg">${name} sent you<br> a friend request!</span>
			</div>
			<div class="div-buttons mt-3 text-xs flex">
				<button data-friend-id=${friendId} id="toastify-btn-accept-request" class="bg-green-500">Accept</button>
				<button data-friend-id=${friendId} id="toastify-btn-reject-request" class="bg-red-500">Reject</button>
			</div>
		`;
		const acceptBtn = div.querySelector(
			"button#toastify-btn-accept-request",
		) as HTMLButtonElement;
		acceptBtn.addEventListener("click", toastifyRequestAccept(friendId));

		const rejectBtn = div.querySelector(
			"button#toastify-btn-reject-request",
		) as HTMLButtonElement;
		rejectBtn.addEventListener("click", toastifyRequestReject(friendId));

		deployToast(`${name} sent you a friend request!`, {
			duration: DURATION * 2,
			avatar,
			className: "friendRequest",
			node: div,
		});
	},

	friendRequestAccepted: (name: string, avatar: string) => {
		deployToast(`${name} accepted your request!`, {
			avatar,
			className: "friendRequestAccepted",
		});
	},

	newMessage: (name: string, avatar: string, friendId: number) => {
		const div = document.createElement("div");
		div.classList.add("content");
		div.innerHTML = /* html */ `
			<div class="top-content flex items-center">
				<img src="${avatar}" class="toastify-avatar mr-1">
				<span class="text-lg">${name} sent you<br> a message!</span>
			</div>
			<!-- <div class="div-buttons mt-3 text-xs flex"> -->
			<!-- 	<button data-friend-id=${friendId} id="toastify-btn-accept-request" class="bg-green-500">Accept</button> -->
			<!-- 	<button data-friend-id=${friendId} id="toastify-btn-reject-request" class="bg-red-500">Reject</button> -->
			<!-- </div> -->
		`;
		// const acceptBtn = div.querySelector(
		// 	"button#toastify-btn-accept-request",
		// ) as HTMLButtonElement;
		// acceptBtn.addEventListener("click", toastifyRequestAccept(friendId));
		//
		// const rejectBtn = div.querySelector(
		// 	"button#toastify-btn-reject-request",
		// ) as HTMLButtonElement;
		// rejectBtn.addEventListener("click", toastifyRequestReject(friendId));

		deployToast(`${name} sent you a message!`, {
			duration: DURATION * 2,
			avatar,
			className: "new-irc-message",
			node: div,
		});
	},
};


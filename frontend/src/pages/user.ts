import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards"
import API from "@/utils/BackendApi";
import QRCode from "qrcode";

const fetchMoreButtonDynamicClasses = "opacity-0 pointer-events-none".split(" ")

const getPlayerLi = (user: FriendUser) => {
	return /* html */`
		<user-card
			variant="friend"
			user-id="${user.id}"
			avatar-url="${user.avatarUrl}"
			display-name="${user.displayName}"
			id="user-id-${user.id}"
		>
		</user-card>
	`
}

const fetchFriends = (page: number, limit: number, cb: (data: { friends?: FriendUser[] }) => void) => {
	const auth = AuthManager.getInstance()
	auth.authFetch(Router.makeUrl(API.auth.friends.me, {}, {
		page: String(page), limit: String(limit)
	}), {
		method: "GET",
	}).then(res => {
		res?.json().then((data: { friends?: FriendUser[] }) => {
			console.log(data)
			if (data.friends) {
				cb(data)
			} else {
				console.error("Error fetching friends: ", data)
			}
		})
	})
}

const component = async () => {
	const auth = AuthManager.getInstance()
	const user = auth.User!;

	const twofaToggleHtml = /* html */`
		<div class="mt-6">
						<label class="inline-flex items-center cursor-pointer">
				<input type="checkbox" id="twofa-checkbox" class="sr-only peer">
				<div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
				<div id=\"twofa-label\" class=\"ml-3 text-sm text-gray-700\">Enable 2FA</div>
			</label>
		</div>
		<div id=\"twofa-modal\" class=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden transition-opacity duration-300 opacity-0\">
			<div class="bg-white p-6 rounded shadow max-w-md w-full">
				<h3 class="text-lg font-semibold mb-4">2FA Setup</h3>
				<p class="text-gray-700 mb-2">Scan the QR code using your authenticator app:</p>
				<img id="qr-image" class="border rounded max-w-xs mx-auto mb-2"  alt=""/>
				<p class="text-sm text-gray-500 text-center mb-4">Or enter manually: <span id="qr-secret" class="bg-gray-100 px-2 py-1 rounded font-mono"></span></p>
				<button id="twofa-done" class="block mx-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Done</button>
			</div>
		</div>
	`

	const template = /* html */`
		<div class="user flex-1">
			<nav class="m-7">
				<a href="/">Home</a>
			</nav>
			<main class="max-w-[90%]">
				<div class="flex flex-col">
					<h3 class="text-2xl self-start font-bold mb-1">Profile</h3>
					<user-card
						variant="profile"
						user-id="${user.id}"
						avatar-url="${user.avatarUrl}"
						display-name="${user.displayName}">
					</user-card>
					${twofaToggleHtml}
				</div>
				<div class="flex flex-col mt-5">
					<div class="flex gap-4 items-center">
						<button
							id="FetchMore"
							class="${fetchMoreButtonDynamicClasses.join(" ")} rounded-md bg-blue-500 p-1 text-white">
							Fetch More
						</button>
					</div>	
					<h3 class="text-2xl self-start font-bold mb-1">Friends</h3>
					<ul class="flex flex-col gap-2 mt-2" id="friends-list"></ul>
				</div>
			</main>
		</div>
`;

	document.querySelector('#app')!.innerHTML = template;

	const friendsListUl = document.querySelector("ul#friends-list")
	const fetchMoreButton = document.querySelector("#FetchMore") as HTMLButtonElement
	const twofaCheckbox = document.querySelector("#twofa-checkbox") as HTMLInputElement;
	const twofaStatus = await auth.authFetch("/auth/2fa/status", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ userId: user.id })
	});
	const twofaData = await twofaStatus.json();
	twofaCheckbox.checked = !!twofaData.enabled;
	const label = document.querySelector("#twofa-label") as HTMLElement;
	if (label) label.textContent = twofaCheckbox.checked ? "Disable 2FA" : "Enable 2FA";
	const qrImage = document.querySelector("#qr-image") as HTMLImageElement
	const qrSecret = document.querySelector("#qr-secret") as HTMLElement
	const modal = document.querySelector("#twofa-modal") as HTMLElement
	const doneBtn = document.querySelector("#twofa-done") as HTMLButtonElement

	if (!friendsListUl) return

	let requestPage = 1;
	let requestSize = 30;
	let canFetchMore = false;

	const postRequestUpdate = (updateMode: UIUpdateMode) =>
		(data: { friends?: FriendUser[] }) => {
			if (data.friends) {
				requestPage++
				canFetchMore = data.friends.length === requestSize

				if (canFetchMore) {
					fetchMoreButton.classList.remove(...fetchMoreButtonDynamicClasses)
				}
				else {
					fetchMoreButton.classList.add(...fetchMoreButtonDynamicClasses)
				}
				updateFriendsList(data.friends, updateMode)
			}
		}

	const updateFriendsList = (friends: FriendUser[], uiUpdateMode: UIUpdateMode = "replace") => {
		if (!friendsListUl) {
			console.warn("Friends list not found")
			return
		}
		let FriendsListTemplate = ""
		friends.forEach(u => {
			FriendsListTemplate += getPlayerLi(u)
		});
		if (uiUpdateMode === "append") {
			friendsListUl.innerHTML += FriendsListTemplate
		} else if (uiUpdateMode === "replace") {
			friendsListUl.innerHTML = FriendsListTemplate
		}
	}

	const clickHandler = (e: MouseEvent) => {
		if (!e.target) return;
		if (!(e.target instanceof Element)) return;

		const fetchMoreButton = e.target.closest("#FetchMore")
		if (fetchMoreButton) {
			console.log("Fetch more button clicked")
			fetchFriends(requestPage, requestSize, postRequestUpdate("append"))
		}
	}
	twofaCheckbox?.addEventListener("change", async () => {
		const label = document.querySelector("#twofa-label") as HTMLElement;
		if (label) label.textContent = twofaCheckbox.checked ? "Disable 2FA" : "Enable 2FA";
		try {
			const enabled = twofaCheckbox.checked;
			const res = await auth.authFetch("/auth/2fa/toggle", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: user.id, enabled })
			});
			const data = await res.json();
			if (enabled && data.secret && data.otpauth_url) {
				const qrDataUrl = await QRCode.toDataURL(data.otpauth_url);
				qrImage.src = qrDataUrl;
				qrSecret.textContent = data.secret;
				document.body.classList.add("overflow-hidden");
				modal.classList.remove("hidden");
				setTimeout(() => modal.classList.add("opacity-100"), 10);
			} else {
				modal.classList.remove("opacity-100");
				modal.classList.add("opacity-0");
				setTimeout(() => {
					modal.classList.add("hidden");
					document.body.classList.remove("overflow-hidden");
				}, 300);
				qrImage.src = "";
				qrSecret.textContent = "";
			}
		} catch (err) {
			console.error("Error while toggling 2FA:", err);
		}
	});
	doneBtn?.addEventListener("click", () => {
		modal.classList.add("hidden");
	});
	document.addEventListener("click", clickHandler)
	fetchFriends(requestPage, requestSize, postRequestUpdate("replace"))

	return () => {
		document.removeEventListener("click", clickHandler)
	}
}

Router.getInstance().register({ path: '/user', guards: [authGuard], component });

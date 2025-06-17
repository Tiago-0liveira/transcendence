import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";
import API from "@/utils/BackendApi";

const getPlayerLi = (user: FriendUser) => {
	return /* html */ `
		<user-card
			class="flex-none w-[280px]"
			variant="friend"
			user-id="${user.id}"
			avatar-url="${user.avatarUrl}"
			display-name="${user.displayName}"
			id="user-id-${user.id}"
			online="${user.online}"
		></user-card>
	`;
};

const getBlockedLi = (user: FriendUser) => {
	return /* html */ `
		<user-card
			class="flex-none w-[280px]"
			variant="blocked"
			user-id="${user.id}"
			avatar-url="${user.avatarUrl}"
			display-name="${user.displayName}"
			id="blocked-user-id-${user.id}"
		></user-card>
	`;
};

const fetchFriends = (page: number, limit: number, cb: (data: { friends?: FriendUser[] }) => void) => {
	const auth = AuthManager.getInstance();
	auth.authFetch(Router.makeUrl(API.auth.friends.me, {}, {
		page: String(page), limit: String(limit)
	}), {
		method: "GET"
	}).then(res => {
		res?.json().then((data: { friends?: FriendUser[] }) => {
			if (data.friends) cb(data);
			else console.error("Error fetching friends:", data);
		});
	});
};

const fetchBlockedUsers = (page: number, limit: number, cb: (data: { blocked?: FriendUser[] }) => void) => {
	const auth = AuthManager.getInstance();
	auth.authFetch(Router.makeUrl(API.auth.friends.blocked, {}, {
		page: String(page), limit: String(limit)
	}), {
		method: "GET"
	}).then(res => {
		res?.json().then((data: { blocked?: FriendUser[] }) => {
			if (data.blocked) cb(data);
			else console.error("Error fetching blocked users:", data);
		});
	});
};

const component = async () => {
	const template = /* html */ `
		<div class="profile-card">
			<main class="max-w-[90%] mx-auto">
				<div class="flex flex-col gap-10 mt-12 h-full">
					<!-- Блок друзей -->
					<section>
						<h2 class="text-center text-lg mb-4">Friends</h2>
						<div class="overflow-x-auto max-w-full">
							<ul
								id="friends-list"
								class="flex gap-4 px-2 w-fit scrollbar-thin scrollbar-thumb-gray-500"
							></ul>
						</div>
					</section>

					<!-- Блок заблокированных пользователей -->
					<section>
						<h2 class="text-center text-lg mb-4">Blocked players</h2>
						<div class="overflow-x-auto max-w-full">
							<ul
								id="blocked-list"
								class="flex gap-4 px-2 w-fit scrollbar-thin scrollbar-thumb-gray-500"
							></ul>
						</div>
					</section>
				</div>
			</main>
		</div>
	`;

	document.querySelector("#app")!.innerHTML = template;

	// Friends list
	const friendsListUl = document.querySelector("ul#friends-list");
	if (!friendsListUl) return;

	let requestPage = 1;
	const requestSize = 30;
	let canFetchMore = false;

	const updateFriendsList = (friends: FriendUser[], mode: UIUpdateMode = "replace") => {
		let html = "";
		friends.forEach(user => html += getPlayerLi(user));
		if (mode === "append") friendsListUl.innerHTML += html;
		else friendsListUl.innerHTML = html;
	};

	const postRequestUpdate = (mode: UIUpdateMode) =>
		(data: { friends?: FriendUser[] }) => {
			if (data.friends) {
				requestPage++;
				canFetchMore = data.friends.length === requestSize;
				updateFriendsList(data.friends, mode);
			}
		};

	const handleScroll = () => {
		if (!canFetchMore) return;
		const { scrollLeft, scrollWidth, clientWidth } = friendsListUl;
		if (scrollLeft + clientWidth >= scrollWidth - 50) {
			fetchFriends(requestPage, requestSize, postRequestUpdate("append"));
		}
	};

	friendsListUl.addEventListener("scroll", handleScroll);
	fetchFriends(requestPage, requestSize, postRequestUpdate("replace"));

	// Blocked list
	const blockedListUl = document.querySelector("ul#blocked-list");
	if (!blockedListUl) return;

	let blockedPage = 1;
	const blockedSize = 30;
	let canFetchMoreBlocked = false;

	const updateBlockedList = (blocked: FriendUser[], mode: UIUpdateMode = "replace") => {
		let html = "";
		blocked.forEach(user => html += getBlockedLi(user));
		if (mode === "append") blockedListUl.innerHTML += html;
		else blockedListUl.innerHTML = html;
	};

	const postBlockedRequestUpdate = (mode: UIUpdateMode) =>
		(data: { blocked?: FriendUser[] }) => {
			if (data.blocked) {
				blockedPage++;
				canFetchMoreBlocked = data.blocked.length === blockedSize;
				updateBlockedList(data.blocked, mode);
			}
		};

	const handleBlockedScroll = () => {
		if (!canFetchMoreBlocked) return;
		const { scrollLeft, scrollWidth, clientWidth } = blockedListUl;
		if (scrollLeft + clientWidth >= scrollWidth - 50) {
			fetchBlockedUsers(blockedPage, blockedSize, postBlockedRequestUpdate("append"));
		}
	};

	blockedListUl.addEventListener("scroll", handleBlockedScroll);
	fetchBlockedUsers(blockedPage, blockedSize, postBlockedRequestUpdate("replace"));

	return () => {
		friendsListUl.removeEventListener("scroll", handleScroll);
		blockedListUl.removeEventListener("scroll", handleBlockedScroll);
	};
};

Router.getInstance().register({ path: "/friends", guards: [authGuard], component });

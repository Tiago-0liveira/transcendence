import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards"
import API from "@/utils/BackendApi";

const getPlayerLi = (user: FriendUser) => {
	return /* html */`
		<user-card
			variant="friend"
			user-id="${user.id}"
			avatar-url="${user.avatarUrl}"
			display-name="${user.displayName}"
			id="user-id-${user.id}"
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

const component = async () => {
	const template = /* html */`
		<div class="profile-card">
			<nav class="my-5 flex justify-center">
				<h1>Friends</h1>
			</nav>
			<main class="max-w-[90%] mx-auto">
				<div class="flex flex-row items-start gap-10 mt-12 h-full">
					<div class="flex flex-col flex-1">
						<ul
							id="friends-list"
							class="grid gap-4 overflow-y-auto max-h-[calc(100vh-200px)] grid-cols-[repeat(auto-fit,minmax(250px,1fr))]"
						></ul>
					</div>
				</div>
			</main>

		</div>
	`;


	document.querySelector('#app')!.innerHTML = template;

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

		const { scrollTop, scrollHeight, clientHeight } = friendsListUl;
		if (scrollTop + clientHeight >= scrollHeight - 50) {
			fetchFriends(requestPage, requestSize, postRequestUpdate("append"));
		}
	};

	friendsListUl.addEventListener("scroll", handleScroll);

	// Initial fetch
	fetchFriends(requestPage, requestSize, postRequestUpdate("replace"));

	return () => {
		friendsListUl.removeEventListener("scroll", handleScroll);
	};
};

Router.getInstance().register({ path: '/friends', guards: [authGuard], component });

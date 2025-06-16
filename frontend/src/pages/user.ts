import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards"
import API from "@/utils/BackendApi";

const fetchMoreButtonDynamicClasses = "opacity-0 pointer-events-none".split(" ")

const getPlayerLi = (user: FriendUser) => {
	return /* html */`
		<user-card
			variant="friend"
			user-id="${user.id}"
			avatar-url="${user.avatarUrl}"
			display-name="${user.displayName}"
			id="user-id-${user.id}"
			online="${user.online}"
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
	document.addEventListener("click", clickHandler)
	fetchFriends(requestPage, requestSize, postRequestUpdate("replace"))

	return () => {
		document.removeEventListener("click", clickHandler)
	}
}

Router.getInstance().register({ path: '/user', guards: [authGuard], component });

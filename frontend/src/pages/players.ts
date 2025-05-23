import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards"
import API from "@/utils/BackendApi";
import { debounce } from "@/utils/requests";

const fetchMoreButtonDynamicClasses = "opacity-0 pointer-events-none".split(" ")

const fetchUsers = (query: string, page: number, limit: number, cb: (query: string, data: { users?: PossibleFriendUser[] }) => void) => {
	const auth = AuthManager.getInstance()

	auth.authFetch(Router.makeUrl(API.auth.friends.possibleFriends, {}, {
		name: query, page: String(page), limit: String(limit)
	}), {
		method: "GET",
	}).then(res => {
		res?.json().then((data: { users?: PossibleFriendUser[] }) => {
			if (data.users) {
				cb(query, data)
			} else {
				console.error("Error fetching users: ", data)
			}
		})
	})
}

const getPlayerLi = (user: PossibleFriendUser) => {
	return /* html */`
		<user-card 
			variant="possibleFriend" 
			user-id="${user.id}" 
			avatar-url="${user.avatarUrl}" 
			display-name="${user.displayName}"
			is-pending="${user.isPending}"
			has-invited-me="${user.hasInvitedMe}"
			id="user-id-${user.id}"
		>
		</user-card>
	`
}

const component = async () => {
	const template = /* html */`
		<div class="user relative flex-1 flex flex-col items-center">
			<nav class="my-5">
				<h1>Players</h1>
			</nav>
			<main class="relative flex w-[95%] min-h-0 flex-1 flex-col gap-5 items-center">
				<div class="flex min-w-[50%] max-w-[70%] flex-col items-center justify-center gap-4">
					<div class="flex gap-4 items-center">
						<label class="text-xl">Search Player</label>
						<input class="flex-1 rounded-md bg-slate-200" name="search-query" placeholder="Search for a user">
						<button id="FetchMore" class="${fetchMoreButtonDynamicClasses.join(" ")} rounded-md bg-blue-500 p-2 text-white">Fetch More</button>
					</div>
				</div>
				<ul style="max-height: calc(100vh - 250px);" class="grid gap-4 w-full grid-cols-[repeat(auto-fit,minmax(250px,1fr))] players-list overflow-y-auto">

				</ul>
			</main>
		</div>
	`;
	document.querySelector('#app')!.innerHTML = template;

	const playersList = document.querySelector("ul.players-list")
	const inputQueryEl: HTMLInputElement = document.querySelector(`input[name="search-query"]`)!
	const fetchMoreButton = document.querySelector("#FetchMore") as HTMLButtonElement

	let requestPage = 1;
	let requestSize = 30;
	let lastQuery = ""
	let canFetchMore = false;


	if (inputQueryEl) {
		inputQueryEl.focus();
	}

	const postRequestUpdate = (updateMode: UIUpdateMode) =>
		(query: string, data: { users?: PossibleFriendUser[] }) => {
			if (data.users) {
				if (query !== lastQuery) {
					requestPage = 1
					lastQuery = query
				}
				else {
					requestPage++
				}
				canFetchMore = data.users.length === requestSize

				if (canFetchMore) {
					fetchMoreButton.classList.remove(...fetchMoreButtonDynamicClasses)
				}
				else {
					fetchMoreButton.classList.add(...fetchMoreButtonDynamicClasses)
				}
				updateUsersList(data.users, updateMode)
			}
		}

	const updateUsersList = (users: PossibleFriendUser[], uiUpdateMode: UIUpdateMode = "replace") => {
		if (!playersList) {
			console.warn("Players list not found")
			return
		}
		let playersListTemplate = ""
		users.forEach(u => {
			playersListTemplate += getPlayerLi(u)
		});
		if (uiUpdateMode === "append") {
			playersList.innerHTML += playersListTemplate
		} else if (uiUpdateMode === "replace") {
			playersList.innerHTML = playersListTemplate
		}
	}

	const handleInput = debounce((value: string) => {
		value = value.trim()
		if (!value) return
		console.log("Debounce Fetch users with query", value, "page", requestPage, "size", requestSize)
		fetchUsers(value, requestPage, requestSize, postRequestUpdate("replace"))

	}, 300);

	const handleClick = (e: MouseEvent) => {
		if (!e.target) return;
		if (!(e.target instanceof Element)) return;

		const fetchMoreButton = e.target.closest("#FetchMore")
		if (fetchMoreButton) {
			fetchUsers(inputQueryEl.value.trim(), requestPage, requestSize, postRequestUpdate("append"))
		}
	}

	const handleInputChange = (ev: Event) => {
		const target = ev.target as HTMLSelectElement | HTMLInputElement;

		if (target) {
			if (lastQuery !== target.value) {
				requestPage = 1
				lastQuery = target.value
			}
			handleInput(target.value)
		}
	}

	document.addEventListener("click", handleClick)
	inputQueryEl.addEventListener("input", handleInputChange)

	return () => {
		document.removeEventListener("click", handleClick)
		inputQueryEl.removeEventListener("input", handleInputChange)
	}
}

Router.getInstance().register({ path: '/players', guards: [authGuard], component });

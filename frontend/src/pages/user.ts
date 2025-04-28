import Router from "@/router/Router";
import { authGuard } from "@/router/guards";

const component = async () => {
	const template = /*html */ `
    <nav class="bg-blue-600 text-white p-4 shadow-md">
        <div class="container mx-auto flex justify-between items-center">
            <a href="/" class="text-xl font-bold hover:text-purple-400">Transcendence</a>
            <div class="space-x-4">
                <ul class="flex flex-row space-x-4">
                    <li><a href="" class="hover:text-purple-400">Home</a></li>
                    <li><a href="" class="hover:text-purple-400">Leaderboard</a></li>
                    <li><a href="" class="hover:text-purple-400">Chat</a></li>
                    <li><a href="" class="hover:text-purple-400">Play</a></li>
                </ul>
            </div>
            <div class="flex relative items-center">
                <button type="button" class="flex text-sm rounded-full focus:ring-4 focus: ring-purple-400" id="menu-user-button" aria-expanded="false"> 
                <span class="sr-only">user menu</span>
                <img class="w-8 h-8 rounded-full" src="42-logo.svg" alt="user image">
                </button> 
                <!-- dropdown menu -->
                <div class = "z-50 hidden absolute left-0 top-10 w-30 mt-2 text-base divide-y divide-gray-100 list-none bg-blue-600 rounded-lg shadow-sm" id="user-dropdown-menu">
                    <div class="px-4 py-3">
                        <span class= "block text-sm text-gray-900">${window.user?.username}</span>
                        <span class= "block text-sm text-gray-500 truncate">${window.user?.username}</span>
                    </div>
                    <ul class="py-2" role="menu" aria-labelledby="menu-user-button">
                        <li><a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Profile</a></li>
                        <li><a href="/userSettings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Settings</a></li>
                        <li><a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Sign Out</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
		<div class="user">
			<h1>Hello ${window.user?.username}</h1>
			<nav>
				<a href="/">Home</a>
			</nav>
		</div>
	`;
	document.querySelector("#app")!.innerHTML = template;

	const userMenuButton = document.getElementById("menu-user-button");
	const userDropdown = document.getElementById("user-dropdown-menu");

	userMenuButton?.addEventListener("click", (e) => {
		e.stopPropagation();
		const isExpanded = userMenuButton.getAttribute("aria-expanded") === "true";
		userMenuButton.setAttribute("aria-expanded", (!isExpanded).toString());
		userDropdown?.classList.toggle("hidden");
	});

	window.addEventListener("click", (e: MouseEvent) => {
		const target = e.target as Node;
		if (!userMenuButton?.contains(target) && !userDropdown?.contains(target)) {
			userDropdown?.classList.add("hidden");
			userMenuButton?.setAttribute("aria-expanded", "false");
		}
	});
};

Router.getInstance().register({
	path: "/user",
	guards: [authGuard],
	component,
});

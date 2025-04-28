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
                        <li><a href="/user" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Profile</a></li>
                        <li><a href="/userSettings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Settings</a></li>
                        <li><a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Sign Out</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
   <div class="flex items-center justify-center h-screen">
    <div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm">
        <form class=" p-6 space-y-6" action="#">
        <h5 class="text-xl text-center font-medium mb-4 text-gray-900">Settings</h5>
        <div class= "flex items-center justify-center">
        <img id="userAvatar" class="rounded-full w-32 h-32" src="42-logo.svg" alt="">
        </div>
        <div>
            <!--label for="email" class= "block mb-0.5 text-sm font-medium text-gray-900 ">Your email</label> -->
            <input type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="New email" required  minlength="5" maxlength="25"/>
        </div>
        <div>
            <!-- <label for="username" class= "block mb-0.5 text-sm font-medium text-gray-900 ">Your username</label> -->
            <input type="username" name="username" id="username" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="New username" required  minlength="5" maxlength="25"/>
        </div>
        <div>
            <!-- <label for="password" class= "block mb-0.5 text-sm font-medium text-gray-900 ">Your password</label> -->
            <input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="New password" required  minlength="8" maxlength="25"/>
        </div>
        <div>
            <!-- <label for="password" class= "block mb-0.5 text-sm font-medium text-gray-900 ">Your password</label> -->
            <input type="password" name="password" id="password" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5" placeholder="Confirm your new password" required  minlength="8" maxlength="25"/>
        </div>
        <div class="flex items-start">
            <div class="flex items-start">
                <div class="flex items-center h-5">
                    <input id="remember" type="checkbox" value="" class="w-4 h-4 border border-gray-300 rounded-sm bg-gray-50 focus:ring-3 focus:ring-purple-500">
                </div>
                <label for="remember" class="ms-2 text-sm font-medium text-gray-900">Remember me</label>
            </div>
        </div>
        <button type="submit" class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-1 text-center" >Sign Up</button>
         <div class= "flex justify-center flex-row space-x-6">
             <div class= "border rounded-lg p-0.5 border-yellow-300">
             <button>Save changes</button>
             </div>
             <div class="border rounded-lg p-0.5 border-gray-700">
                <button>Delete account</button> 
             </div> 
         </div>  
        </form>
    </div>
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
	path: "/userSettings",
	guards: [authGuard],
	component,
});

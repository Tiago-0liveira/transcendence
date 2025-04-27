import Router from "@/router/Router";
import { authGuard } from "@/router/guards";

const component = async () => {
	const template = `
    <nav class="bg-blue-600 text-white p-4 shadow-md">
        <div class="container mx-auto flex justify-between items-center">
            <a href="/" class="text-xl font-bold hover:text-purple-400">Transcendence</a>
            <div class="space-x-4">
                <ul class="flex flex-row space-x-4">
                    <li><a href="" class="hover:text-purple-400">Home</a></li>
                    <li><a href="" class="hover:text-purple-400">Leaderboard</a></li>
                    <li><a href="" class="hover:text-purple-400">Chat</a></li>
                    <li><a href="" class="hover:text-purple-400">Play</a></li>
                    <li><a href="" class="hover:text-purple-400">Profile</a></li>
                    <li><a href="" class="hover:text-purple-400">Logout</a></li>
                </ul>
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
};

Router.getInstance().register({
	path: "/user",
	guards: [authGuard],
	component,
});

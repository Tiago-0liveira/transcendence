import Router from "@/router/Router";

const component = async () => {
	const loggedIn = Boolean(window.user);
	const userElement = loggedIn
		? '<a href="/user">My User</a>'
		: '<a href="/login">Login with 42</a>';

	// <img src="42-logo.svg" class="h-8" alt="42School logo">
	// <span class="self-center text-2xl ">Transcendence</span>
	// <div class="flex space-x-7" id="navbar-left">

	//TODO: Add
	//@layer components {
	//    .custom-container{
	//      @apply tailwindcss classes
	//      }
	// } in order to isolate the styles we want to specifically
	const template = `
    <nav class="bg-blue-600 text-white p-4 shadow-md">
        <div class="container mx-auto flex justify-between items-center">
            <a href="/" class="text-xl font-bold">Transcendence</a>
            <div class="space-x-4">
                <a href="/login" class="hover:text-blue-300">Sign In</a>
                <a href="/register" class="hover:text-blue-300">Sign Up</a>
            </div>
        </div>
    </nav>
    <div class="home p-5"> <!-- Added padding for better spacing -->
        <nav class="mt-4"> <!-- Added margin-top for spacing -->
            ${userElement}
        </nav>
    </div>
	`;
	document.querySelector("#app")!.innerHTML = template;
};

Router.getInstance().register({ path: "/", component });

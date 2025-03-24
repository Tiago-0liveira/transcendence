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
    <nav class="top-0 bg-white  dark:bg-blue-900">
        <div class="max-w-screen-xl border-gray-200 flex items-center justify-between ">
            <a href="" class="">Transcendence</a>
            <div class="flex space-x-6">
                    <a class="" href="#">Sign In</a>
                    <a class="" href="#">Sign Up</a>
            </div>
        </div>
    </nav>
		<div class="home h-40 flex flex-col justify-evenly">
			<nav>
				${userElement}
			</nav>
		</div>
	`;
	document.querySelector("#app")!.innerHTML = template;
};

Router.getInstance().register({ path: "/", component });

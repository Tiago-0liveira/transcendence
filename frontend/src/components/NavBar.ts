import { baseElement } from "./baseElement";

export class NavBar extends baseElement {
	constructor() {
		super();
	}

	render(): string {
		return `
               <nav id="main-navbar" class="bg-green-400 p-4">
                   <div class="max-w-7xl mx-auto flex items-center justify-between">
                       <div></div>
                   </div>
               </nav>
               `;
	}
}

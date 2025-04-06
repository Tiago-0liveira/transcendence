export class baseElement extends HTMLElement {
	private elementEventListeners: {
		[key: string]: { element: HTMLElement; eventCallback: EventListener }[];
	} = {};
	// elementEventListeners: any;
	private isRendered = false;

	constructor() {
		super();
		// this.elementEventListeners = [];
	}
	connectedCallback(): void {
		// console.log("hello from connectedCallback");
		if (!this.isRendered && this.render() !== null) {
			this.innerHTML = this.render() + this.style;
			this.isRendered = true;
			this.postRender();
		}
		return;
	}

	disconnectedCallback(): void {
		this.removeEveryElementEventListener();
	}

	attributeChangedCallback(): void {
		this.updateRender();
	}

	render(): string {
		return "";
	}

	addElementEventListener(
		element: HTMLElement,
		event: string,
		callback: EventListener,
		callbackInstance: any = this,
	) {
		if (element) {
			if (!this.elementEventListeners[event]) {
				this.elementEventListeners[event] = [];
			}
			const eventCallback = callback.bind(callbackInstance);
			this.elementEventListeners[event].push({ element, eventCallback });
			element.addEventListener(event, eventCallback);
		}
	}

	removeElementEventListener(element: HTMLElement, event: string) {
		const evListeners = this.elementEventListeners[event];
		if (evListeners) {
			for (let evListener of evListeners) {
				if (evListener.element === element) {
					element.removeEventListener(event, evListener.eventCallback);
					evListeners.splice(evListeners.indexOf(evListener), 1);
				}
			}
		}
	}

	removeEveryElementEventListener() {
		for (let event in this.elementEventListeners) {
			if (this.elementEventListeners.hasOwnProperty(event)) {
				const eventListeners = this.elementEventListeners[event];
				for (const eventListener of eventListeners) {
					eventListener.element.removeEventListener(
						event,
						eventListener.eventCallback,
					);
				}
			}
		}
		this.elementEventListeners = {};
	}

	updateRender(): string {
		return this.render() + this.style;
	}

	getStyle(): string {
		return "<style></style>";
	}

	postRender(): void {}
}

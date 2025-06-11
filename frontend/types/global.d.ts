import Router from '@/router/Router.ts';
import UserCard from '@/components/UserCard.ts';
import NavBar from '@/components/NavBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import RoomCard from '@/components/RoomCard';

declare global {
	interface ImportMeta {
		env: {
			VITE_BACKEND_URL?: string;
			VITE_GOOGLE_CLIENT_ID?: string;
		}
	}
	/**
	 * @description Registering elements here will make it possible
	 *  for `document.createElement("<ElementTagName>")`
	 *  */
	interface HTMLElementTagNameMap {
		"user-card": UserCard;
		"nav-bar": NavBar;
		"loading-spinner": LoadingSpinner;
		"room-card": RoomCard;
		"bracket-card": BracketCard;
		"uncompleted-bracket-card": UncompletedBracketCard;
	}

	type StringsObject = Record<string, string>;
}

// This ensures this file is treated as a module
export { };
import AuthManager from "@/auth/authManager";
import Toastify from "toastify-js";
import API from "./BackendApi";
import Router from "@/router/Router";

const DURATION = 5000;

const defaultToastOptions: Toastify.Options = {
  duration: DURATION,
  gravity: "top",
  position: "right",
  stopOnFocus: true,
  close: true,
  style: {
    display: "flex",
    alignItems: "center",
    fontSize: "20px",
    borderRadius: "8px",
    padding: "10px",
    margin: "10px",
    marginTop: "50px",
  },
} as const;

const toastifyRequestResultHandler = (ev: MouseEvent, text: string) => {
  if (!ev.target || !(ev.target instanceof HTMLButtonElement)) return;
  const parent = ev.target.closest(".toastify"); // ищем корневой тост
  if (!parent) return;

  const topContent = parent.querySelector(".top-content");
  if (!topContent) return;

  const divButtons = parent.querySelector(".div-buttons");
  if (divButtons) divButtons.remove();

  topContent.innerHTML = `
		<span class="text-white font-bold text-sm sm:text-base font-sans">
			${text}
		</span>
	`;

  setTimeout(() => {
    parent.remove();
  }, 2000);
};


const toastifyRequestAccept = (userId: number) => (ev: MouseEvent) => {
  AuthManager.getInstance()
    .authFetch(API.auth.friends.requests.accept, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
    .then((res) => {
      res?.json().then((data: { error?: string }) => {
        if (data.error) {
          console.error("Error accepting friend request", data.error);
          toastifyRequestResultHandler(
            ev,
            "Error accepting the friend request!",
          );
          return;
        }
        toastifyRequestResultHandler(ev, "You accepted the friend request!");
      });
    })
    .catch((err) => {
      console.error("Error Accepting friend request", err);
      toastifyRequestResultHandler(ev, "Error accepting the friend request!");
    });
};

const toastifyRequestReject = (userId: number) => (ev: MouseEvent) => {
  AuthManager.getInstance()
    .authFetch(API.auth.friends.requests.reject, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
    .then((res) => {
      res?.json().then((data: { error?: string }) => {
        if (data.error) {
          console.error("Error rejecting friend request", data.error);
          toastifyRequestResultHandler(
            ev,
            "Error rejecting the friend request!",
          );
          return;
        }
        toastifyRequestResultHandler(ev, "You rejected the friend request!");
      });
    })
    .catch((err) => {
      console.error("Error Rejecting friend request", err);
      toastifyRequestResultHandler(ev, "Error rejecting the friend request!");
    });
};

const deployToast = (text: string, options: Toastify.Options) => {
  Toastify({
    text: text,
    ...defaultToastOptions,
    ...options,
    style: {
      ...defaultToastOptions.style,
      ...options.style,
    },
  }).showToast();
};

const tournamentRedirect = (roomId: string, gameId: string) => (ev: MouseEvent) => {
    if (!gameId) {
      Router.getInstance().navigate(`/games/lobby-room`, false, {}, {roomId});
      toastifyRequestResultHandler(ev, "Prepare for battle!");
    }
    else {
      Router.getInstance().navigate(`/games/game-room`, false, {}, {roomId, gameId});
      toastifyRequestResultHandler(ev, "Now you are in game room. Prepare for battle!");
    }
}

export const toastHelper = {
  success: (message: string) => {
    deployToast(message, {
      avatar: "/notifications/success-circle.svg",
      className: "success",
      style: {
        background: "green",
      },
    });
  },

  error: (message: string) => {
    deployToast(message, {
      avatar: "/notifications/error-circle.svg",
      className: "error",
      style: {
        background: "red",
      },
    });
  },

  info: (message: string) => {
    deployToast(message, {
      className: "info",
      avatar: "/notifications/info-circle.svg",
      style: {},
    });
  },

  warning: (message: string) => {
    deployToast(message, {
      avatar: "/notifications/warning-circle.svg",
      className: "warning",
      style: {
        background: "orange",
      },
    });
  },

  friendOnline: (name: string, avatar: string) => {
    deployToast(`${name} is now online!`, {
      avatar,
      className: "friendOnline",
    });
  },

  friendRequest: (name: string, avatar: string, friendId: number) => {
    const div = document.createElement("div");
    div.classList.add("content");
    div.innerHTML = /* html */ `
      <div class="top-content flex items-center">
          <img src="${avatar}" class="toastify-avatar mr-2 w-8 h-8 rounded-full">
          <span class="text-sm sm:text-base leading-tight font-bold">
              ${name} sent you<br>
              <span class="font-semibold">a friend request!</span>
          </span>
      </div>
      <div class="div-buttons mt-3 flex gap-2 justify-end text-xl">
          <button
              id="toastify-btn-accept-request"
              data-friend-id="${friendId}"
              class="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              title="Accept"
          >✓</button>
          <button
              id="toastify-btn-reject-request"
              data-friend-id="${friendId}"
              class="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              title="Reject"
          >✕</button>
      </div>
  `;
    const acceptBtn = div.querySelector(
      "button#toastify-btn-accept-request",
    ) as HTMLButtonElement;
    acceptBtn.addEventListener("click", toastifyRequestAccept(friendId));

    const rejectBtn = div.querySelector(
      "button#toastify-btn-reject-request",
    ) as HTMLButtonElement;
    rejectBtn.addEventListener("click", toastifyRequestReject(friendId));

    deployToast(`${name} sent you a friend request!`, {
      duration: DURATION * 2,
      avatar,
      className: "friendRequest",
      node: div,
    });
  },

  friendRequestAccepted: (name: string, avatar: string) => {
    deployToast(`${name} accepted your request!`, {
      avatar,
      className: "friendRequestAccepted",
    });
  },

  copyToClipboard: (copyName: string, copyText: string) => {
    navigator.clipboard
      .writeText(copyText)
      .then(() => {
        deployToast(`${copyName} copied to Clipboard!`, {
          className: "copyToClipboard",
        });
      })
      .catch((err) => {
        toastHelper.error(`Could not copy ${copyName} to clipboard!`);
      });
  },

  newMessage: (name: string, avatar: string, friendId: number) => {
    const div = document.createElement("div");
    div.classList.add("content");
    div.innerHTML = /* html */ `
			<div class="top-content flex items-center">
				<img src="${avatar}" class="toastify-avatar mr-1">
				<span class="text-lg">${name} sent you<br> a message!</span>
			</div>
		`;
    deployToast(`${name} sent you a message!`, {
      duration: DURATION * 2,
      avatar,
      className: "chat-notification",
      node: div,
    });
  },

  tournamentGameReady: (
      username: string,
      avatarUrl: string,
      roomId: string,
      gameId: string
  ) => {
    const div = document.createElement("div");
    div.classList.add("content");

    const shortName =
        username.length > 10 ? username.slice(0, 7) + "…" : username;

    div.innerHTML = /* html */ `
		<div class="top-content flex items-center text-sm sm:text-base font-sans font-bold text-white">
			<span>
				Your tournament game against
			</span>
			<div class="flex items-center ml-2" title="${username}">
				<img src="${avatarUrl}" alt="${username} avatar"
					class="w-5 h-5 rounded-full border border-gray-600 mr-1" />
				<span class="font-semibold text-red-500">${shortName}</span>
			</div>
			<span class="ml-1">is ready!</span>
		</div>
		<div class="div-buttons mt-3 flex gap-2 justify-end text-sm sm:text-base">
			<button
				id="toastify-btn-join-game"
				class="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				Join
			</button>
		</div>
	`;

    const joinBtn = div.querySelector("#toastify-btn-join-game") as HTMLButtonElement;
    joinBtn.addEventListener("click", tournamentRedirect(roomId, gameId));

    deployToast(`Your game against ${username} is ready`, {
      duration: DURATION * 2,
      avatar: avatarUrl,
      className: "tournamentGameReady",
      node: div,
    });
  },

  gameReady: (
      roomId: string,
      sourceName: string,
      roomName: string,
      roomType: string,
      sourceAvatarURL: string,
  ) => {
    const div = document.createElement("div");
    div.classList.add("content");

    const shortName =
        sourceName.length > 10 ? sourceName.slice(0, 7) + "…" : sourceName;

    div.innerHTML = /* html */ `
		<div class="top-content flex items-center text-sm sm:text-base font-sans font-bold text-white">
			<img src="${sourceAvatarURL}" alt="${sourceName} avatar"
				class="w-5 h-5 rounded-full border border-gray-600 mr-2" />
			<span class="font-semibold text-red-500 mr-1" title="${sourceName}">${shortName}</span>
			<span>invited you to join</span>
			<span class="ml-1 text-green-400">${roomType}</span>
			<span class="ml-1">game in</span>
			<span class="ml-1 text-yellow-200">"${roomName}"</span>
			<span class="ml-1">room.</span>
		</div>
		<div class="div-buttons mt-3 flex gap-2 justify-end text-sm sm:text-base">
			<button
				id="toastify-btn-join-game"
				class="px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
			>
				Join
			</button>
		</div>
	`;

    const joinBtn = div.querySelector("#toastify-btn-join-game") as HTMLButtonElement;
    let gameId = "";
    joinBtn.addEventListener("click", tournamentRedirect(roomId, gameId));
    // joinBtn.addEventListener("click", () => {
    //   Router.getInstance().navigate(`/games/game-room`, false, {}, { roomId });
    // });

    deployToast(`${sourceName} invited you to join ${roomType} game in "${roomName}"`, {
      duration: DURATION * 2,
      avatar: sourceAvatarURL,
      className: "gameReadyToast",
      node: div,
    });
  }

};

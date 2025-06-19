import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { conditionalRender } from "@/utils/conditionalRender";
import "@/components/chatComponent2";

const component = async () => {
  const loggedInUser = Boolean(AuthManager.getInstance().User);

  const template = /* html */ `
    <chat-sidebar2></chat-sidebar2>
        <div class="profile-card centered auth-box game-selection-box">
          <div class="settings-header">Choose Game Mode</div>

          <div class="form-input-group">
<!--            <a href="/game/rooms" class="btn-steam-fixed game-select-button">-->
            <a href="/games/rooms" class="btn-steam-fixed game-select-button">
              <span>Quick Play</span>
            </a>
          </div>

          <div class="form-input-group">
            <a href="/games/new-config" class="btn-steam-fixed game-select-button">
              <span>Create Room</span>
            </a>
          </div>

          <div class="form-section-divider"></div>

          <div class="form-section-title bottom">
            <span>Looking for friends?</span>
            <a href="/players" class="form-input-label create-account-link">Go to Players List</a>
          </div>
        </div>
`;
  document.querySelector("#app")!.innerHTML = template;
};

Router.getInstance().register({ path: "/game", component });

import Router from "@/router/Router";


const component = async () => {
    const template = /* html */`
		<div class="profile-card guide-page">
\t<h1 class="settings-header">Transcendence — User Guide</h1>

\t<!-- Block 1: Project Overview -->
\t<div class="guide-section">
\t\t<h2 class="form-section-title">1. Project Overview</h2>
\t\t<p>
\t\t\tTranscendence is a multiplayer arcade game inspired by the classic Pong, reimagined with modern mechanics, customization, and social features.<br>
\t\t\tThe project was created by 42 students (tiagoliv, acuva-nu, qrolande, akatlyn) and includes both a frontend interface and a backend infrastructure with authentication, a tournament system, and game rooms.
\t\t</p>
\t\t<!-- Screenshot placeholder -->
\t\t<img src="/assets/screenshots/project-overview.png" class="guide-screenshot" alt="Project Overview Screenshot">
\t</div>

\t<!-- Block 2: Game Modes -->
\t<div class="guide-section">
\t\t<h2 class="form-section-title">2. Game Modes</h2>
\t\t<ul>
\t\t\t<li><strong>1v1</strong> — classic duel between two players.</li>
\t\t\t<li><strong>Tournament</strong> — customizable mode for 4 players with a bracket of 3 matches.</li>
\t\t\t<li><strong>Local Game</strong> — play on the same device for two players.</li>
\t\t</ul>
\t\t<p>Each mode supports <strong>public</strong> or <strong>friends-only</strong> visibility settings.</p>
\t\t<img src="/assets/screenshots/game-modes.png" class="guide-screenshot" alt="Game Modes Screenshot">
\t</div>

\t<!-- Block 3: Interface and Navigation -->
\t<div class="guide-section">
\t\t<h2 class="form-section-title">3. Interface and Navigation</h2>
\t\t<p>The top navigation bar includes:</p>
\t\t<ul>
\t\t\t<li><strong>Game</strong> — start a new match.</li>
\t\t\t<li><strong>Players</strong> — view all registered players.</li>
\t\t\t<li><strong>Profile</strong> — view your profile info, avatar, and stats.</li>
\t\t\t<li><strong>Friends</strong> — manage your friends list.</li>
\t\t\t<li><strong>Settings</strong> — update login, nickname, password, avatar, and configure 2FA.</li>
\t\t\t<li><strong>Logout</strong> — sign out of the system.</li>
\t\t\t<li><strong>Sign Up</strong> — register a new user.</li>
\t\t\t<li><strong>Chat</strong> — in-game communication with other users.</li>
\t\t</ul>
\t\t<img src="/assets/screenshots/navigation.png" class="guide-screenshot" alt="Navigation Screenshot">
\t</div>

\t<!-- Block 4: Rooms -->
\t<div class="guide-section">
\t\t<h2 class="form-section-title">4. Rooms</h2>
\t\t<p>
\t\t\tAll games take place inside rooms.<br>
\t\t\tEach room has an owner, a status, a unique name, and a list of connected players.<br>
\t\t\tRooms can be <strong>public</strong> or <strong>friends-only</strong>.<br>
\t\t\tThe owner can start the match once all players are ready.<br>
\t\t\tYou can create either a <strong>tournament</strong> or a <strong>regular</strong> room.
\t\t</p>
\t\t<img src="/assets/screenshots/rooms.png" class="guide-screenshot" alt="Rooms Screenshot">
\t</div>

\t<!-- Block 5: Tournaments -->
\t<div class="guide-section">
\t\t<h2 class="form-section-title">5. Tournaments</h2>
\t\t<p>
\t\t\tThe tournament system includes an automatic <strong>bracket grid</strong>.<br>
\t\t\tPlayers join their matches as they become ready.<br>
\t\t\tEach bracket shows game status, player names, and scores.<br>
\t\t\tIf you're a participant in the match, a <strong>Join Game</strong> button will appear.
\t\t</p>
\t\t<img src="/assets/screenshots/tournament.png" class="guide-screenshot" alt="Tournament Screenshot">
\t</div>

\t<!-- Block 6: Authentication and Security -->
\t<div class="guide-section">
\t\t<h2 class="form-section-title">6. Authentication and Security</h2>
\t\t<p>
\t\t\tYou can log in using traditional registration or <strong>Google OAuth</strong>.<br>
\t\t\t<strong>Two-Factor Authentication (2FA)</strong> is supported via an authenticator app.<br>
\t\t\tAll tokens are securely stored in <strong>HttpOnly cookies</strong>.
\t\t</p>
\t\t<img src="/assets/screenshots/authentication.png" class="guide-screenshot" alt="Authentication Screenshot">
\t</div>

\t<!-- Block 7: FAQ -->
\t<div class="guide-section">
\t\t<h2 class="form-section-title">7. Frequently Asked Questions</h2>
\t\t<p><strong>How do I start a game?</strong><br>Go to <em>Game</em>, choose a mode, wait for other players, then click <em>Start Game</em>.</p>
\t\t<p><strong>How do I add a friend?</strong><br>Go to <em>Players</em>, find the user, and send a friend request.</p>
\t\t<p><strong>What if I can't join a room?</strong><br>Check the room's status and player count. Public rooms may be full.</p>
\t\t<img src="/assets/screenshots/faq.png" class="guide-screenshot" alt="FAQ Screenshot">
\t</div>
</div>

	`;
    document.querySelector('#app')!.innerHTML = template;
}

Router.getInstance().register({ path: '/transcendence', component });
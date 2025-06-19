import Router from "@/router/Router";


const component = async () => {
	const template = /* html */`
		<div class="profile-card guide-page">
<h1 class="settings-header">Transcendence — User Guide</h1>

<!-- Block 1: Project Overview -->
<div class="guide-section">
<h2 class="form-section-title">1. Project Overview</h2>
<p>
Transcendence is a multiplayer arcade game inspired by the classic Pong, reimagined with modern mechanics, customization, and social features.<br>
The project was created by 42 students (tiagoliv, acuva-nu, qrolande, akatlyn) and includes both a frontend interface and a backend infrastructure with authentication, a tournament system, and game rooms.
</p>
<!-- Screenshot placeholder -->
<div class="guide-avatars">
<img src="/assets/avatars/Tiago.png" alt="Tiago Pixel Portrait">
<img src="/assets/avatars/Acuva.png" alt="Acuva Pixel Portrait">
    <img src="/assets/avatars/SEREGA.png" alt="Sergey Pixel Portrait">  
<img src="/assets/avatars/Evneniy.png" alt="Evneniy Pixel Portrait">
    
</div>
</div>

<!-- Block 2: Game Modes -->
<div class="guide-section">
<h2 class="form-section-title">2. Game Modes</h2>
<ul>
<li><strong>1v1</strong> — classic duel between two players.</li>
<li><strong>Tournament</strong> — customizable mode for 4 players with a bracket of 3 matches.</li>
<li><strong>Local Game</strong> — play on the same device for two players.</li>
</ul>
<p>Each mode supports <strong>public</strong> or <strong>friends-only</strong> visibility settings.</p>
<img src="/assets/manual/MODES.png" class="guide-screenshot" alt="Game Modes Screenshot">
</div>

<!-- Block 3: Interface and Navigation -->
<div class="guide-section">
<h2 class="form-section-title">3. Interface and Navigation</h2>
<p>The top navigation bar includes:</p>
<ul>
      <li><strong>Chat</strong> — in-game communication with other users.</li>
<li><strong>Game</strong> — start a new match.</li>
<li><strong>Players</strong> — view all registered players.</li>
<li><strong>Profile</strong> — view your profile info, avatar, and stats.</li>
<li><strong>Friends</strong> — manage your friends list.</li>
<li><strong>Settings</strong> — update login, nickname, password, avatar, and configure 2FA.</li>
<li><strong>Logout</strong> — sign out of the system.</li>
<!--<li><strong>Sign Up</strong> — register a new user.</li>-->

</ul>
<img src="/assets/manual/NAVBAR.png" class="guide-screenshot" alt="Navigation Screenshot">
</div>

<!-- Block 4: Rooms -->
<div class="guide-section">
<h2 class="form-section-title">4. Rooms</h2>
<p>
All games take place inside rooms.<br>
Each room has an owner, a status, a unique name, and a list of connected players.<br>
Rooms can be <strong>public</strong> or <strong>friends-only</strong>.<br>
The owner can start the match once all players are ready.<br>
You can create either a <strong>tournament</strong> or a <strong>regular</strong> room.
</p>
<img src="/assets/manual/ROOM1.png" class="guide-screenshot" alt="Rooms Screenshot">
    <img src="/assets/manual/ROOM2.png" class="guide-screenshot" alt="Rooms Screenshot">
</div>

<!-- Block 5: Tournaments -->
<div class="guide-section">
<h2 class="form-section-title">5. Tournaments</h2>
<p>
The tournament system includes an automatic <strong>bracket grid</strong>.<br>
Players join their matches as they become ready.<br>
Each bracket shows game status, player names, and scores.<br>
If you're a participant in the match, a <strong>Join Game</strong> button will appear.
</p>
<img src="/assets/manual/TRNMNT.png" class="guide-screenshot" alt="Tournament Screenshot">
</div>

<!-- Block 6: Authentication and Security -->
<div class="guide-section">
<h2 class="form-section-title">6. Authentication and Security</h2>
<p>
You can log in using traditional registration or <strong>Google OAuth</strong>.<br>
<strong>Two-Factor Authentication (2FA)</strong> is supported via an authenticator app.<br>
All tokens are securely stored in <strong>HttpOnly cookies</strong>.
</p>
<img src="/assets/manual/2FA1.png" class="guide-screenshot" alt="Authentication Screenshot">
    <img src="/assets/manual/2FA2.png" class="guide-screenshot" alt="Authentication Screenshot">
</div>

<!-- Block 7: FAQ -->
<div class="guide-section">
<h2 class="form-section-title">7. Frequently Asked Questions</h2>
<p><strong>How do I start a game?</strong><br>Go to <em>Game</em>, choose a mode, wait for other players, then click <em>Start Game</em>.</p>
<p><strong>How do I add a friend?</strong><br>Go to <em>Players</em>, find the user, and send a friend request.</p>
<p><strong>What if I can't join a room?</strong><br>Check the room's status and player count. Public rooms may be full.</p>
<img src="/assets/manual/GOT.png" class="guide-screenshot" alt="FAQ Screenshot">
</div>
</div>

	`;
	document.querySelector('#app')!.innerHTML = template;
}

Router.getInstance().register({ path: '/', component });
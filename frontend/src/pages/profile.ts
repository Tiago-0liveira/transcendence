import AuthManager from "@/auth/authManager";
import Router from "@/router/Router";
import { authGuard } from "@/router/guards";
import API from "@/utils/BackendApi";
import Chart from 'chart.js/auto';

const profileComponent = async () => {
    const auth = AuthManager.getInstance();
    const currentUser = auth.User!;

    const path = window.location.pathname;
    const match = path.match(/^\/profile\/(\d+)$/);
    const isOwnProfile = path === "/profile";
    const targetUserId = match ? parseInt(match[1], 10) : null;

    if (!isOwnProfile && targetUserId === currentUser.id) {
        await Router.getInstance().navigate("/profile")
        return;
    }

    let response;
    if (isOwnProfile) {
        response = await auth.authFetch(API.profile, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
    } else if (targetUserId !== null) {
        response = await auth.authFetch(`${API.profile}/${targetUserId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include"
        });
    } else {
        document.querySelector("#app")!.innerHTML = `<div class="text-red-500 p-4">Invalid profile path</div>`;
        return;
    }

    if (!response.ok || !response) {
        document.querySelector("#app")!.innerHTML = `<div class="text-red-500 p-4">Failed to load stats</div>`;
        return;
    }

    const data = await response.json();
    const stats = data.result.stats;
    const history = data.result.history;

    let statusText: string;
    let statusClass: string;

    if (isOwnProfile) {
        statusText = "Online";
        statusClass = "text-green-400";
    } else {
        statusText = stats.connected ? "Online" : "Offline";
        statusClass = stats.connected ? "text-green-400" : "text-red-400";
    }
    const wins = stats.wins ?? 0;
    const losses = stats.losses ?? 0;
    const totalGames = stats.totalGames ?? 0;
    const tournamentWins = stats.tournamentWins ?? 0;
    const tournamentLosses = stats.tournamentLosses ?? 0;
    const tournamentTotal = tournamentWins + tournamentLosses;

    const tournamentWinRate = tournamentTotal > 0 ? Math.round((tournamentWins / tournamentTotal) * 100) : 0;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    let rank = "Unknown";
    if (winRate <= 25) rank = "Bronze";
    else if (winRate <= 50) rank = "Silver";
    else if (winRate <= 75) rank = "Gold";
    else rank = "GrandMaster";

    const displayName = isOwnProfile ? currentUser.displayName : stats.displayName ?? `User ${targetUserId}`;
    const avatarUrl = isOwnProfile ? currentUser.avatarUrl : stats.avatarUrl ?? "";

    function formatDuration(ms: number): string {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = date.toLocaleString("en", { month: "short" }); // "Jun"
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    const tableRows = history.map(game => {
        const winnerName = game.winner?.displayName ?? "Unknown";
        const loserName = game.loser?.displayName ?? "Unknown";

        const winnerShort = winnerName.length > 10 ? winnerName.slice(0, 10) + "…" : winnerName;
        const loserShort = loserName.length > 10 ? loserName.slice(0, 10) + "…" : loserName;

        const winnerId = game.winnerId;
        const loserId = game.loserId;

        return `
		<tr class="border-b border-gray-700 hover:bg-gray-800">
			<td class="px-4 py-2 text-center">
				<div class="flex items-center gap-2 justify-start">
					<img src="${game.winner?.avatarUrl || ''}" alt="Winner avatar" class="w-6 h-6 rounded-full border border-gray-600" />
					<a href="/profile/${winnerId}" class="hover:underline" title="${winnerName}">
						${winnerShort}
					</a>
				</div>
			</td>
			<td class="px-4 py-2 text-center">${game.scoreWinner}</td>
			<td class="px-4 py-2 text-center">
				<div class="flex items-center gap-2 justify-start">
					<img src="${game.loser?.avatarUrl || ''}" alt="Loser avatar" class="w-6 h-6 rounded-full border border-gray-600" />
					<a href="/profile/${loserId}" class="hover:underline" title="${loserName}">
						${loserShort}
					</a>
				</div>
			</td>
			<td class="px-4 py-2 text-center">${game.scoreLoser}</td>
			<td class="px-4 py-2 text-center">${formatDate(game.startTime)}</td>
			<td class="px-4 py-2 text-center">${formatDuration(game.duration)}</td>
		</tr>
	`;
    }).join("");

    const table = /* html */`
		<div class="overflow-x-auto mt-6">
			<table class="min-w-full text-sm text-gray-200 bg-gray-900 border border-gray-700">
				<thead class="bg-gray-800 text-gray-100 text-xs uppercase tracking-wider">
					<tr>
						<th class="px-4 py-2">Winner</th>
						<th class="px-4 py-2">Score (W)</th>
						<th class="px-4 py-2">Loser</th>
						<th class="px-4 py-2">Score (L)</th>
						<th class="px-4 py-2">Date</th>
						<th class="px-4 py-2">Duration</th>
					</tr>
				</thead>
				<tbody>
					${tableRows}
				</tbody>
			</table>
		</div>
	`;

    const template = /* html */`
		<div class="profile-card p-6 bg-[#1b1b1b] rounded-xl border-2 border-gray-700 shadow-lg max-w-5xl mx-auto text-gray-200">
			<div class="flex flex-col space-y-6">
				<div class="text-2xl font-bold text-center">
					<span>${displayName}</span>
				</div>

				<div class="flex flex-row justify-evenly items-center">
					<img class="w-24 h-24 rounded-full border border-gray-600" src="${avatarUrl}" alt="User avatar" />
					<div class="bg-[#2b2b2b] p-4 rounded-lg border border-gray-700 text-left">
						<p class="mb-1">Status: <span class="${statusClass}">${statusText}</span></p>
						<p class="mb-1">Total games: ${totalGames}</p>
						<p class="mb-1">Winrate: ${winRate}%</p>
						<p class="mb-1">T winrate: ${tournamentWinRate}%</p>
						<p class="mb-1">Rank: ${rank}</p>
					</div>
				</div>

				<div class="bg-[#2b2b2b] p-6 rounded-lg border border-gray-700 text-left mt-6">
					<h3 class="text-xl font-semibold mb-4 border-b border-gray-600 pb-2 text-center">User Stats</h3>
                        <div class="flex flex-col md:flex-row flex-wrap gap-6 justify-center min-h-[320px]">
                            <!-- Pie Chart: Win Rate -->
                            <div class="flex-1 min-w-[250px] max-w-[300px] flex flex-col items-center justify-start">
                                <h4 class="text-center text-sm mb-2">Win Rate</h4>
                                <canvas id="pieChartOverall" class="h-[280px] w-full"></canvas>
                            </div>
                        
                            <!-- Pie Chart: Tournament Win Rate -->
                            <div class="flex-1 min-w-[250px] max-w-[300px] flex flex-col items-center justify-start">
                                <h4 class="text-center text-sm mb-2">Tournament Win Rate</h4>
                                <canvas id="pieChartTournament" class="h-[280px] w-full"></canvas>
                            </div>
                        
                            <!-- Bar Chart: Wins vs Losses -->
                            <div class="flex-1 min-w-[250px] max-w-[300px] flex flex-col justify-end">
                                <h4 class="text-center text-sm mb-2">Wins vs Losses</h4>
                                <div class="flex-grow flex items-end">
                                    <canvas id="barChart" class="w-full" height="280"></canvas>
                                </div>
                            </div>
                        </div>
				</div>

				<div>
					<h3 class="text-xl font-semibold mb-2 border-b border-gray-600 pb-1">Game History</h3>
					${table}
				</div>
			</div>
		</div>
	`;

    document.querySelector("#app")!.innerHTML = template;

    // Chart.js
    const ctxPie1 = document.getElementById("pieChartOverall") as HTMLCanvasElement;
    const ctxPie2 = document.getElementById("pieChartTournament") as HTMLCanvasElement;
    const ctxBar = document.getElementById("barChart") as HTMLCanvasElement;

    new Chart(ctxPie1, {
        type: "pie",
        data: {
            labels: ["Wins", "Losses"],
            datasets: [{
                data: [wins, losses],
                backgroundColor: ["#4ade80", "#f87171"]
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#d1d5db" }
                }
            }
        }
    });

    new Chart(ctxPie2, {
        type: "pie",
        data: {
            labels: ["T Wins", "T Losses"],
            datasets: [{
                data: [tournamentWins, tournamentLosses],
                backgroundColor: ["#60a5fa", "#f87171"]
            }]
        },
        options: {
            plugins: {
                legend: {
                    position: "bottom",
                    labels: { color: "#d1d5db" }
                }
            }
        }
    });

    new Chart(ctxBar, {
        type: "bar",
        data: {
            labels: ["Wins", "Losses"],
            datasets: [{
                label: "Games",
                data: [wins, losses],
                backgroundColor: ["#4ade80", "#f87171"]
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: "#d1d5db" }
                },
                x: {
                    ticks: { color: "#d1d5db" }
                }
            }
        }
    });
};

Router.getInstance().register({
    path: "/profile",
    guards: [authGuard],
    component: profileComponent
});

Router.getInstance().register({
    path: "/profile/:id",
    guards: [authGuard],
    component: profileComponent
});

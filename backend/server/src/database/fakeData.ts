import { faker } from "@faker-js/faker"

export function generateUser(): UserParams {
	return {
		username: faker.internet.username(),
		displayName: faker.person.fullName(),
		avatarUrl: faker.image.avatar(),
		password: faker.internet.password(),
	};
}

export function generateGameHistory(insertNum: number = 200): GameHistoryParams {
    if (insertNum < 2) {
        throw new Error("Need at least 2 users to generate game history.");
    }

    const startDateTime = faker.date.past({ years: 1 });
    const endDateTime = faker.date.soon({ refDate: startDateTime, days: 1, minutes: 5 });
    const duration = Math.floor(endDateTime.getTime() - startDateTime.getTime());

    const winnerScore = 7;
    const loserScore = faker.number.int({ min: 0, max: winnerScore - 1 });

    let winnerId = faker.number.int({ min: 1, max: insertNum });
    let loserId = faker.number.int({ min: 1, max: insertNum });

    let attempts = 0;
    while (winnerId === loserId && attempts++ < 10) {
        loserId = faker.number.int({ min: 1, max: insertNum });
    }

    if (winnerId === loserId) {
        throw new Error("Could not generate unique winner and loser IDs");
    }

    return {
        lobbyId: faker.string.uuid(),
        winnerId,
        loserId,
        scoreWinner: winnerScore,
        scoreLoser: loserScore,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        duration
    };
}

export function generateUserStats(id: number): UserStatsParams {
    const wins = faker.number.int({ min: 0, max: 100 });
    const losses = faker.number.int({ min: 0, max: 100 });
    const totalGames = wins + losses;

    const tournamentWins = faker.number.int({ min: 0, max: 20 });
    // Ensure tournamentLosses are not greater than tournamentWins
    const tournamentLosses = faker.number.int({ min: 0, max: tournamentWins });

    return {
        userId: id, // Generates a random user ID
        wins: wins,
        losses: losses,
        totalGames: totalGames,
        tournamentWins: tournamentWins,
        tournamentLosses: tournamentLosses,
    };
}
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
	const startTime = faker.date.past({ years: 1 }).toISOString();
    const endTime = faker.date.soon({ refDate: startTime, days: 1, hours: 0, minutes: 5 }).toISOString();

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);
    const duration = endDateTime.getTime() - startDateTime.getTime(); // Duration in milliseconds

    const winnerScore = 7;
    const loserScore = faker.number.int({ min: 0, max: winnerScore - 1 });

    let winnerId = faker.number.int({ min: 1, max: insertNum });
    let loserId = faker.number.int({ min: 1, max: insertNum });

    // Ensure winnerId and loserId are different
    while (winnerId === loserId) {
        loserId = faker.number.int({ min: 1, max: insertNum });
    }

    return {
        lobbyId: faker.string.uuid(),
        winnerId: winnerId,
        loserId: loserId,
        scoreWinner: winnerScore,
        scoreLoser: loserScore,
        startTime: startTime,
        endTime: endTime,
        duration: duration,
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
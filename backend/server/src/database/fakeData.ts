import { faker } from "@faker-js/faker"

export function generateUser() {
	return {
		username: faker.internet.username(),
		displayName: faker.person.fullName(),
		avatarUrl: faker.image.avatar(),
		password: faker.internet.password(),
	};
}

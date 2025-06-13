/**
 * @description Converts time in milliseconds to a string format "%d min %d sec"
 * @param time Time in milliseconds
 * @returns Formatted time string
 */
export const timeToText = function (time: number): string {
	let totalSeconds = Math.floor(time / 1000);
	let minutes = Math.floor(totalSeconds / 60);
	let seconds = totalSeconds % 60;

	let res = "";
	if (minutes > 0) res += `${minutes} min `;
	if (seconds > 0 || minutes === 0) res += `${seconds} sec`;

	return res.trim();
};

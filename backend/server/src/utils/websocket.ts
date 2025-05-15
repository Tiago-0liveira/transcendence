import type { RawData } from "ws";

export function processRawData(data: RawData): string {
	if (Buffer.isBuffer(data)) {
		return data.toString('utf-8');
	} else if (data instanceof ArrayBuffer) {
		const uint8Array = new Uint8Array(data);
		return new TextDecoder('utf-8').decode(uint8Array);
	} else if (Array.isArray(data) && data.every(Buffer.isBuffer)) {
		const concatenatedBuffer = Buffer.concat(data);
		return concatenatedBuffer.toString('utf-8');
	} else {
		throw new Error("Unsupported RawData format");
	}
}
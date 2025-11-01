export class WTTDataNotFoundError extends Error {
	constructor() {
		super('WTT data file not found.');
		this.name = 'WTTDataNotFoundError';
	}
}

import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { WTTDataNotFoundError } from './errors';

export type WTTData = {
	projects: {
		[projectName: string]: {
			[date: string]: {
				[branchName: string]: number;
			};
		};
	};
};

export class StorageService {
	private static FILE_NAME = '.wtt.json';

	static hasWTTStorage(): boolean {
		const path = this.getGlobalFilePath();
		return fs.existsSync(path);
	}

	static async createWTTStorage() {
		if (!fs.existsSync(this.getGlobalFilePath())) {
			const initialData = this.getDefaultData();
			await this.saveWTTData(initialData);
		}
	}

	static async loadWTTData(): Promise<WTTData> {
		const path = this.getGlobalFilePath();

		if (!this.hasWTTStorage()) {
			await this.createWTTStorage();
		}

		const rawData = fs.readFileSync(path, 'utf-8');
		return JSON.parse(rawData) as WTTData;
	}

	private static async saveWTTData(data: WTTData) {
		if (!this.hasWTTStorage()) {
			await this.createWTTStorage();
		}

		const filePath = this.getGlobalFilePath();
		await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
	}

	static async addWTTEntry({
		branchName,
		date,
		projectName,
		seconds
	}: {
		projectName: string;
		date: string;
		branchName: string;
		seconds: number;
	}) {
		const data = await this.loadWTTData();

		if (!data.projects[projectName]) {
			data.projects[projectName] = {};
		}

		if (!data.projects[projectName][date]) {
			data.projects[projectName][date] = {};
		}

		if (!data.projects[projectName][date][branchName]) {
			data.projects[projectName][date][branchName] = 0;
		}

		data.projects[projectName][date][branchName] += seconds;

		await this.saveWTTData(data);
	}

	static clearWTTData() {
		if (!this.hasWTTStorage()) {
			throw new WTTDataNotFoundError();
		}

		fs.writeFileSync(this.getGlobalFilePath(), JSON.stringify(this.getDefaultData()), 'utf-8');
	}

	static exitWTTProcesses(projectName?: string) {
		const homeDir = os.homedir();
		const files = fs.readdirSync(homeDir);

		if (projectName) {
			const pidFile = `.wtt.${projectName}.pid`;
			if (files.includes(pidFile)) {
				fs.removeSync(path.join(homeDir, pidFile));
			}
			return;
		}

		files.forEach(file => {
			if (file.match(/^\.wtt\..+\.pid$/)) {
				fs.removeSync(path.join(homeDir, file));
			}
		});
	}

	static async confirmAction(prompt: string): Promise<boolean> {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
		return new Promise(resolve => {
			rl.question(prompt, (answer: string) => {
				rl.close();
				resolve(answer.trim().toLowerCase() === 'y');
			});
		});
	}

	private static getGlobalFilePath() {
		return path.join(os.homedir(), this.FILE_NAME);
	}

	private static getDefaultData(): WTTData {
		return {
			projects: {}
		};
	}
}

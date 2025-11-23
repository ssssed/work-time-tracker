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
	private static DIR_NAME = 'wtt';
	private static FILE_NAME = 'wtt.json';
	private static LOG_FILE_NAME = '.wtt.log';

	static hasWTTStorage(): boolean {
		const path = this.getGlobalFilePath();
		return fs.existsSync(path);
	}

	static async createWTTStorage() {
		this.init();

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
		try {
			const filePath = this.getGlobalFilePath();

			await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
		} catch (error: any) {
			throw new Error(`Failed to save WTT data: ${error?.message || error}`);
		}
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
		const dirPath = this.getGlobalDirPath();

		if (!fs.existsSync(dirPath)) return;

		const files = fs.readdirSync(dirPath);
		const pidRegex = this.getPidFileRegex();

		if (projectName) {
			const pidPath = this.getGlobalPidFilePath(projectName);
			if (fs.existsSync(pidPath)) {
				fs.removeSync(pidPath);
			}
			return;
		}

		files.forEach(file => {
			if (pidRegex.test(file)) {
				fs.removeSync(path.join(dirPath, file));
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

	static init() {
		const path = this.getGlobalDirPath();

		if (fs.existsSync(path)) {
			return;
		}

		fs.mkdirSync(this.getGlobalDirPath());
		fs.writeFileSync(this.getGlobalLogFilePath(), '', 'utf-8');
	}

	private static getGlobalFilePath() {
		return path.join(this.getGlobalDirPath(), this.FILE_NAME);
	}

	private static getGlobalDirPath() {
		return path.join(os.homedir(), this.DIR_NAME);
	}

	private static getPidFileName(projectName: string) {
		return `.wtt.${projectName}.pid`;
	}

	private static getPidFileRegex(): RegExp {
		return /^\.wtt\..+\.pid$/;
	}

	static getGlobalPidFilePath(projectName: string) {
		return path.join(this.getGlobalDirPath(), this.getPidFileName(projectName));
	}

	static getGlobalLogFilePath() {
		return path.join(this.getGlobalDirPath(), this.LOG_FILE_NAME);
	}

	private static getDefaultData(): WTTData {
		return {
			projects: {}
		};
	}
}

import fs from 'fs-extra';
import inquirer from 'inquirer';
import { StorageService } from './storage-service';
import { execSync } from 'node:child_process';

export type WTTProcess = {
	pid: number;
	projectName: string;
	file: string;
};

export class ProcessSelectorService {
	static getProcesses(): WTTProcess[] {
		const pidFiles = StorageService.getPidFiles();

		return pidFiles.map(file => {
			const pidPath = StorageService.getGlobalPidFilePath(file);
			const pid = Number(fs.readFileSync(pidPath, 'utf-8').trim());
			const projectName = file.replace(/\.wtt\.|\.pid/g, '');
			return { pid, projectName, file };
		});
	}

	/** Выбор процесса по projectName, pid или через inquirer */
	static async select(options: { projectName?: string; pid?: number }): Promise<WTTProcess | null> {
		const processes = this.getProcesses();

		if (processes.length === 0) return null;

		const { projectName, pid } = options;

		// 1) По имени проекта
		if (projectName) {
			return processes.find(p => p.projectName === projectName) || null;
		}

		// 2) По PID
		if (pid) {
			return processes.find(p => p.pid === pid) || null;
		}

		// 3) Через меню выбора
		const choices = processes.map(p => ({
			name: `${p.projectName} (pid: ${p.pid})`,
			value: p
		}));

		const answer = await inquirer.prompt([
			{
				type: 'list',
				name: 'selected',
				message: 'Выберите проект для остановки:',
				choices
			}
		]);

		return answer.selected;
	}

	static kill(pcs: WTTProcess | null) {
		if (!pcs) return;

		try {
			process.kill(pcs.pid, 'SIGINT');
		} catch (err: any) {
			if (err.code !== 'ESRCH') throw err;
		}
	}

	static getActiveProcesses(pidFiles: string[] = []): WTTProcess[] {
		let output: string;
		try {
			output = execSync(`ps -axo pid,command`, { encoding: 'utf8' });
		} catch {
			return [];
		}

		const lines = output.split('\n').slice(1).filter(Boolean);

		const processes: WTTProcess[] = lines
			.map(line => {
				const match = line.trim().match(/^(\d+)\s+(.+)$/);
				if (!match) return null;

				const pid = Number(match[1]);
				const file = match[2];

				// определяем projectName через PID-файлы
				let projectName = 'unknown';
				for (const pidFile of pidFiles) {
					try {
						const pidInFile = fs.readFileSync(StorageService.getGlobalPidFilePath(pidFile), 'utf8').trim();

						if (Number(pidInFile) === pid) {
							projectName = StorageService.getPidFileName(pidFile);
							break;
						}
					} catch {}
				}

				return { pid, projectName, file };
			})
			.filter((proc): proc is WTTProcess => proc !== null && proc.file.includes('start.js'));

		return processes;
	}
}

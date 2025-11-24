import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { StorageService } from '../storage-service';

export const stop = async () => {
	try {
		const pidFiles = StorageService.getPidFiles();

		if (pidFiles.length === 0) {
			console.log(chalk.yellow('Нет активных процессов WTT.'));
			return;
		}

		// Собираем список проектов и PID
		const processes = pidFiles.map(file => {
			const pidPath = StorageService.getGlobalPidFilePath(file);
			const pid = fs.readFileSync(pidPath, 'utf-8').trim();
			const projectName = file.replace(/\.wtt\.|\.pid/g, '');
			return { pid, projectName, file };
		});

		const choices = processes.map(p => ({
			name: `${p.projectName} (pid: ${p.pid})`,
			value: p
		}));

		const { selected } = await inquirer.prompt([
			{
				type: 'list',
				name: 'selected',
				message: 'Выберите проект для остановки:',
				choices
			}
		]);

		if (!selected) return;

		process.kill(selected.pid, 'SIGINT');
		StorageService.exitWTTProcesses(selected.projectName);

		console.log(chalk.green(`🛑 Процесс ${selected.projectName} (pid ${selected.pid}) успешно остановлен.`));
	} catch (e) {
		console.error(chalk.red('Ошибка выполнения stop:'), e);
	}
};

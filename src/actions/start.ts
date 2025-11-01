import dayjs from 'dayjs';
import { GitService } from '../git-service';
import { StorageService } from '../storage-service';
import chalk from 'chalk';

export const start = async () => {
	const gitService = new GitService();
	const projectPath = process.cwd();
	const projectName = projectPath.split('/').pop() || projectPath;

	if (!(await gitService.isGitRepo())) {
		console.error(chalk.red('Ошибка: Текущая директория не является git-репозиторием.'));
		process.exit(1);
	}

	const today = dayjs().format('DD-MM-YYYY');
	let currentBranch = await gitService.getCurrentBranch();
	await StorageService.addWTTEntry({
		projectName,
		date: today,
		branchName: currentBranch,
		seconds: 0
	});

	let start = Date.now();
	let lastSaved = Date.now();

	console.log(chalk.green(`🚀 Запуск отслеживания времени работы! Текущая ветка: ${currentBranch}`));

	setInterval(async () => {
		const now = Date.now();
		const branch = await gitService.getCurrentBranch();

		const deltaSeconds = (now - lastSaved) / 1000;
		lastSaved = now;

		await StorageService.addWTTEntry({
			projectName,
			date: today,
			branchName: currentBranch,
			seconds: deltaSeconds
		});

		if (branch !== currentBranch) {
			console.log(`📦 Переключение ветки: ${currentBranch} → ${branch} (${(deltaSeconds / 60).toFixed(1)} мин)`);
			currentBranch = branch;
		}
	}, 4000);

	process.on('SIGINT', async () => {
		const spentSeconds = (Date.now() - start) / 1000;

		await StorageService.addWTTEntry({
			projectName,
			date: today,
			branchName: currentBranch,
			seconds: spentSeconds
		});

		console.log(
			chalk.green(`\n⏹ Отслеживание остановлено. Сохранено ${(spentSeconds / 60).toFixed(1)} минут в ${currentBranch}`)
		);
		process.exit();
	});
};

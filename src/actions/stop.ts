import chalk from 'chalk';
import { StorageService } from '../storage-service';
import { ProcessSelectorService } from '../process-selector-service';

export const stop = async ({ name, pid }: { pid?: string; name?: string }) => {
	try {
		const selected = await ProcessSelectorService.select({ projectName: name, pid: pid ? Number(pid) : undefined });

		if (!selected) {
			console.log(chalk.yellow('Нет активных процессов WTT.'));
			return;
		}

		ProcessSelectorService.kill(selected);
		StorageService.exitWTTProcesses(selected.projectName);

		console.log(chalk.green(`🛑 Процесс ${selected.projectName} (pid ${selected.pid}) успешно остановлен.`));
	} catch (e) {
		console.error(chalk.red('Ошибка выполнения stop:'), e);
	}
};

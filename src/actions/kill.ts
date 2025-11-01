// actions/kill.ts
import { exec } from 'child_process';
import chalk from 'chalk';
import { StorageService } from '../storage-service';

const _killProcesses = () => {
	// Находим все процессы start.js
	exec(`ps aux | grep '[s]tart.js'`, (err, stdout) => {
		const lines = stdout.trim().split('\n');
		if (!lines.length || lines[0] === '' || err) {
			console.log(chalk.yellow('Активных процессов нет.'));
			return;
		}

		const pids = lines.map(line => line.trim().split(/\s+/)[1]);
		if (!pids.length) return;

		// Убиваем все процессы
		exec(`kill -9 ${pids.join(' ')}`, killErr => {
			if (killErr) {
				console.error(chalk.red('Ошибка при убийстве процессов:'), killErr);
				return;
			}

			StorageService.exitWTTProcesses();
			console.log(chalk.green('🛑 Все процессы отслеживания времени работы остановлены.'));
		});
	});
};

export const kill = ({ force = false }: { force?: boolean }) => {
	if (!force) {
		StorageService.confirmAction(
			'⚠️ Вы уверены, что хотите остановить все процессы отслеживания времени работы? (y/N): '
		).then(async confirmed => {
			if (!confirmed) {
				console.log('❎ Отменено.');
				return;
			}

			_killProcesses();
		});
		return;
	}

	_killProcesses();
};

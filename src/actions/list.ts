#!/usr/bin/env node
import { exec } from 'child_process';
import chalk from 'chalk';

export const list = () => {
	// Ищем процессы node, которые запущены твоим демоном start.js
	exec(`ps aux | grep '[s]tart.js'`, (err, stdout, stderr) => {
		if (!stdout.trim() || err) {
			console.log(chalk.yellow('Активных процессов нет.'));
			return;
		}

		console.log(chalk.green('Активные процессы wtt start:'));
		console.log(stdout);
	});
};

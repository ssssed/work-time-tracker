import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { StorageService } from '../storage-service';

export async function startDetached() {
	const projectKey = process.cwd().split('/').pop() || 'unknown-project';
	const pidFile = StorageService.getGlobalPidFilePath(projectKey);
	const logFile = StorageService.getGlobalLogFilePath();

	StorageService.init();

	// Убиваем предыдущий процесс
	if (fs.existsSync(pidFile)) {
		const oldPid = Number(fs.readFileSync(pidFile, 'utf-8'));
		try {
			process.kill(oldPid, 'SIGKILL');
			console.log(`⏹️ Убиваем старый процесс (${oldPid})`);
		} catch {
			console.log(`⚠️ Процесс (${oldPid}) не найден`);
		}
	}

	const scriptPath = path.join(__dirname, '..', '..', 'dist', 'demons', 'start.js');
	const out = fs.openSync(logFile, 'a');
	const err = fs.openSync(logFile, 'a');

	const child = spawn('node', [scriptPath], {
		detached: true,
		stdio: ['ignore', out, err],
		env: { ...process.env, WTT_PROJECT_NAME: projectKey } // передаем проект в демон
	});

	fs.writeFileSync(pidFile, String(child.pid));

	child.unref();
	console.log(`🚀 Work Time Tracker запущен в фоне для проекта "${projectKey}" (PID: ${child.pid})`);
}

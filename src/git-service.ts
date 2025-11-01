import simpleGit, { SimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs-extra';

export class GitService {
	private git: SimpleGit;
	private projectPath: string;

	constructor(projectPath?: string) {
		this.projectPath = projectPath ? path.resolve(projectPath) : process.cwd();
		this.git = simpleGit(this.projectPath);
	}

	/** Возвращает текущую ветку */
	async getCurrentBranch(): Promise<string> {
		try {
			const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
			return branch.trim();
		} catch (err) {
			return 'unknown';
		}
	}

	/** Проверяет, что проект является git-репозиторием */
	async isGitRepo(): Promise<boolean> {
		return fs.existsSync(path.join(this.projectPath, '.git'));
	}
}

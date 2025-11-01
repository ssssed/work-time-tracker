import chalk from 'chalk';
import Table from 'cli-table3';
import path from 'path';
import { WTTData } from './storage-service';
import { plural } from './utils';

export interface ViewOptions {
	all?: boolean; // по умолчанию false
	projectPath?: string; // фильтр по конкретному проекту
	date?: string; // фильтр по конкретной дате DD-MM-YYYY
}

export class ViewService {
	static render(data: WTTData, options: ViewOptions = {}) {
		const allProjects = options.all ?? false;
		const projects = this.filterProjects(data.projects, allProjects, options.projectPath);

		if (Object.keys(projects).length === 0) {
			console.log(chalk.yellow('⚠️ Нет данных для выбранных фильтров.'));
			return;
		}

		if (allProjects) {
			console.log(chalk.bold.cyan('📦 Work Time Tracker — All Projects\n'));
		}

		for (const [projName, projectData] of Object.entries(projects)) {
			console.log(chalk.bold(`📂 ${projName}`));

			const dates = this.filterDates(projectData, options.date);

			for (const date of Object.keys(dates).sort()) {
				console.log(` ├─ 📅 ${date}`);
				const branches = dates[date];

				for (const [branch, seconds] of Object.entries(branches)) {
					if (branch === 'init' && seconds === 0) continue;
					const timeStr = this.formatSeconds(seconds);
					console.log(`   └─ ${branch}  ${timeStr}`);
				}
			}

			console.log();
		}
	}

	static renderTable(data: WTTData, options: ViewOptions = {}) {
		const allProjects = options.all ?? false;
		const projects = this.filterProjects(data.projects, allProjects, options.projectPath);

		if (Object.keys(projects).length === 0) {
			console.log(chalk.yellow('⚠️ Нет данных для выбранных фильтров.'));
			return;
		}

		const table = new Table({
			head: ['Project', 'Date', 'Branch', 'Time'],
			style: { head: ['cyan'] }
		});

		for (const [projName, projectData] of Object.entries(projects)) {
			const dates = this.filterDates(projectData, options.date);

			for (const date of Object.keys(dates).sort()) {
				const branches = dates[date];
				for (const [branch, seconds] of Object.entries(branches)) {
					if (branch === 'init' && seconds === 0) continue;
					table.push([projName, date, branch, this.formatSeconds(seconds)]);
				}
			}
		}

		console.log(table.toString());
	}

	private static formatSeconds(seconds: number): string {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		const parts: string[] = [];

		if (h > 0) {
			parts.push(`${h} ${plural(h, ['час', 'часа', 'часов'])}`);
		}
		if (m > 0) {
			parts.push(`${m} ${plural(m, ['минута', 'минуты', 'минут'])}`);
		}
		if (h === 0 && s > 0) {
			parts.push(`${s} ${plural(s, ['секунда', 'секунды', 'секунд'])}`);
		}

		return parts.join(' ');
	}

	private static filterProjects(projects: WTTData['projects'], all: boolean, projectPath?: string) {
		if (all) return projects;

		const currentPath = projectPath || process.cwd();
		const projectName = path.basename(currentPath);

		return Object.fromEntries(Object.entries(projects).filter(([projName]) => projName === projectName));
	}

	private static filterDates(projectData: WTTData['projects'][string], filterDate?: string) {
		if (!filterDate) return projectData; // если дата не указана — возвращаем все даты
		if (projectData[filterDate]) return { [filterDate]: projectData[filterDate] };
		return {};
	}
}

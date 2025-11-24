import chalk from 'chalk';
import Table from 'cli-table3';
import path from 'path';
import { WTTData } from './storage-service';
import { plural } from './utils';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

export interface ViewOptions {
	all?: boolean; // по умолчанию false
	projectPath?: string; // фильтр по конкретному проекту
	date?: string; // фильтр по конкретной дате DD-MM-YYYY
	today?: boolean;
	period?: string; // период DD-MM-YYYY:DD-MM-YYYY
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

			const dates = this.filterDates(projectData, options);

			for (const date of Object.keys(dates).sort()) {
				console.log(` ├─ 📅 ${date}`);
				const branches = dates[date];

				for (const [branch, seconds] of Object.entries(branches)) {
					if (branch === 'init' && seconds === 0) continue;
					const timeStr = this.formatSeconds(seconds as unknown as number);
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
			const dates = this.filterDates(projectData, options);

			for (const date of Object.keys(dates).sort()) {
				const branches = dates[date];
				for (const [branch, seconds] of Object.entries(branches)) {
					if (branch === 'init' && seconds === 0) continue;
					table.push([projName, date, branch, this.formatSeconds(seconds as unknown as number)]);
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

	private static filterDates(projectData: WTTData['projects'][string], options: ViewOptions) {
		if (options.period) {
			return this.filterByPeriod(projectData, options.period);
		}

		if (options.today) {
			const todayDate = dayjs().format('DD-MM-YYYY');

			return projectData[todayDate] ? { [todayDate]: projectData[todayDate] } : {};
		}

		if (!options.date) return projectData;
		if (projectData[options.date]) return { [options.date]: projectData[options.date] };
		return {};
	}

	private static filterByPeriod(projectData: WTTData['projects'][string], period: string) {
		// период может быть: 01-11-2025:07-11-2025
		// или 01-11:07-11 (год = текущий)
		const [rawFrom, rawTo] = period.split(':');

		if (!rawFrom || !rawTo) {
			console.log(chalk.red('❌ Неверный формат --period. Используй: DD-MM-YYYY:DD-MM-YYYY'));
			return {};
		}

		const currentYear = dayjs().year();

		const normalize = (dateStr: string) => {
			if (dateStr.split('-').length === 2) {
				return `${dateStr}-${currentYear}`;
			}
			return dateStr;
		};

		const from = dayjs(normalize(rawFrom), 'DD-MM-YYYY');
		const to = dayjs(normalize(rawTo), 'DD-MM-YYYY');

		if (!from.isValid() || !to.isValid()) {
			console.log(chalk.red('❌ Неверная дата в периоде.'));
			return {};
		}
		if (to.isBefore(from)) {
			console.log(chalk.red('❌ Конец периода раньше начала.'));
			return {};
		}

		const result: Record<string, any> = {};

		for (const dateStr of Object.keys(projectData)) {
			const date = dayjs(dateStr, 'DD-MM-YYYY');
			if (date.isValid() && (date.isAfter(from) || date.isSame(from)) && (date.isBefore(to) || date.isSame(to))) {
				result[dateStr] = projectData[dateStr];
			}
		}

		return result;
	}
}

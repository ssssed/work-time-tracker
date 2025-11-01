#!/usr/bin/env node
import { Command } from 'commander';
import { view } from './actions/view';
import { clear } from './actions/clear';
import { start } from './actions/start';
import { startDetached } from './actions/start-detached';
import { kill } from './actions/kill';
import { list } from './actions/list';
import { stop } from './actions/stop';

const program = new Command();

program
	.name('work-time-tracker')
	.description('cli утилита, которая собирает затраченное время по дням в каждой ветке с момента запуска')
	.version('1.0.0');

program
	.command('start')
	.description('запускает утилиту по отслеживанию')
	.option('--foreground', 'не запускать в фоне, блокировать терминал', false)
	.action(args => (args.foreground ? start() : startDetached()));

program.command('stop').description('останавливает процесс отслеживания для выбранного проекта').action(stop);

program
	.command('view')
	.description('показывает в виде таблицы время потраченное в каждой ветке')
	.option('-d, --date <dd-mm-yyyy>', 'показывает статистику за определенную дату')
	.option('-a, --all', 'показывает данные по всем проектам')
	.option('-t, --table', 'показывает данные в виде таблицы')
	.action(view);

program
	.command('process:kill')
	.description('убивает запущенный в фоне процесс отслеживания')
	.option('-f, --force', 'пропускает подтверждение')
	.action(kill);

program.command('process:list').description('показывает список запущенных процессов отслеживания').action(list);

program
	.command('clear')
	.description('удаляет все данные')
	.option('-f, --force', 'пропускает подтверждение')
	.action(clear);

program.parse();

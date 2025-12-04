#!/usr/bin/env node
import { ProcessSelectorService } from '../process-selector-service';
import { StorageService } from '../storage-service';
import { ViewService } from '../view-service';

export const list = () => {
	const wttRoot = StorageService.getGlobalDirPath();
	const processes = ProcessSelectorService.getActiveProcesses(wttRoot);

	ViewService.renderActiveProcesses(processes);
};

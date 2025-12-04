#!/usr/bin/env node
import { ProcessSelectorService } from '../process-selector-service';
import { StorageService } from '../storage-service';
import { ViewService } from '../view-service';

export const list = () => {
	const pidFiles = StorageService.getPidFiles();
	const processes = ProcessSelectorService.getActiveProcesses(pidFiles);

	ViewService.renderActiveProcesses(processes);
};

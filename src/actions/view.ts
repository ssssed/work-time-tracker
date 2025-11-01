import { StorageService } from '../storage-service';
import { ViewService } from '../view-service';

export const view = async ({ all = false, date, table }: { date?: string; all?: boolean; table?: boolean }) => {
	const data = StorageService.loadWTTData();
	const method = table ? ViewService.renderTable : ViewService.render;

	return method.bind(ViewService)(data, { all, date, projectPath: all ? undefined : process.cwd() });
};

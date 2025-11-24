import { StorageService } from '../storage-service';
import { ViewService } from '../view-service';

export const view = async ({
	date,
	table,
	period,
	all = false,
	today = false
}: {
	date?: string;
	all?: boolean;
	table?: boolean;
	today?: boolean;
	period?: string;
}) => {
	const data = await StorageService.loadWTTData();
	const method = table ? ViewService.renderTable : ViewService.render;

	return method.bind(ViewService)(data, { all, date, period, projectPath: all ? undefined : process.cwd(), today });
};

import { StorageService } from '../storage-service';
import { ViewService } from '../view-service';

export const view = async ({
	all = false,
	date,
	table,
	today = false
}: {
	date?: string;
	all?: boolean;
	table?: boolean;
	today?: boolean;
}) => {
	const data = await StorageService.loadWTTData();
	const method = table ? ViewService.renderTable : ViewService.render;

	return method.bind(ViewService)(data, { all, date, projectPath: all ? undefined : process.cwd(), today });
};

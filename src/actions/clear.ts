import { WTTDataNotFoundError } from '../errors';
import { StorageService } from '../storage-service';

const _clearAction = () => {
	try {
		StorageService.clearWTTData();
		StorageService.exitWTTProcesses();
		console.log('🧹 Данные успешно очищены.');
	} catch (error) {
		if (error instanceof WTTDataNotFoundError) {
			console.log('📭 Данных для очистки нет.');
			return;
		}

		console.error('Ошибка при очистке данных:', error);
	}
};

export const clear = (opts: { force?: boolean }) => {
	if (!opts.force) {
		StorageService.confirmAction('⚠️ Вы уверены, что хотите удалить все данные? (y/N): ').then(async confirmed => {
			if (!confirmed) {
				console.log('❎ Отменено.');
				return;
			}

			_clearAction();
		});
		return;
	}

	_clearAction();
};

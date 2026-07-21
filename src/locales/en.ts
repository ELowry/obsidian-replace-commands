// locales/en.ts
import enData from './en.json';

export default {
	...enData,
	// Engine Notifications
	NOTICE__APPLIED_CHANGES: (actionName: string, count: number) =>
		enData.NOTICE__APPLIED_CHANGES.replace('{0}', actionName).replace('{1}', count.toString()).replace('{2}', count === 1 ? '' : 's'),
	NOTICE__ERROR: (message: string) => enData.NOTICE__ERROR.replace('{0}', message),
};

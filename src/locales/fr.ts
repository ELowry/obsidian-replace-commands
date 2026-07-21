// locales/fr.ts
import frData from './fr.json';

export default {
	...frData,
	// Engine Notifications
	NOTICE__APPLIED_CHANGES: (actionName: string, count: number) =>
		frData.NOTICE__APPLIED_CHANGES.replace('{0}', actionName).replace('{1}', count.toString()).replace('{2}', count === 1 ? '' : 's'),
	NOTICE__ERROR: (message: string) => frData.NOTICE__ERROR.replace('{0}', message),
};

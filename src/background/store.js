// import { configureStore } from '@reduxjs/toolkit';
import { createStore, combineReducers, compose, applyMiddleware } from 'redux';

import clipboardSettingsReducer from '../common/clipboardSettingsReducer';
import copiedItemsReducer from '../common/clipboardItemsReducer';
import { clearPersistentStore } from '../chromeStorageRedux/createPersistenceStore';
import connectToOtherPartsEnhancer from '../chromeStorageRedux/connectToOtherPartsEnhancer';
import testingCounterReducer from '../common/testingCounterReducer';
import { createLogger } from 'redux-logger';
import globalPersistenceEnhancer from '../chromeStorageRedux/globalPersistenceEnhancer';
import logLevel from '../common/appLogger';
import { isUndefinedOrNull } from '../chromeStorageRedux/utils';
import getContextPersistenceEnhancer from '../chromeStorageRedux/contextPersistenceEnhancer';

console.log(`Inside store.js - Setting up redux store`);

const logger = createLogger({
	// ...options
});

const preloadedState = {
	clipboardSettings: {
		visibleOnWebPages: true,
		opacity: 0.7,
		timeToDisappear: 1000, // in ms
		fifo: true,
		clipboardMaxItems: 100, // Post which the oldest item will automatically be removed from clipboard stack
	},
	clipboardItems: [],
	testingCounter: {
		count: 0,
	},
};

// const store = configureStore({
// 	reducer: {
// 		clipboardSettings: clipboardSettingsReducer,
// 		clipboardItems: copiedItemsReducer,
// 	},
// 	preloadedState,
// });

const combinedReducer = combineReducers({
	clipboardSettings: clipboardSettingsReducer,
	clipboardItems: copiedItemsReducer,
	testingCounter: testingCounterReducer,
});

const loggerMiddleware = (storeAPI) => (next) => async (action) => {
	// console.log(
	// 	'         ---->>>>    dispatching | Action Type',
	// 	action?.type,
	// 	` |  Action Payload Text : `,
	// 	action?.payload?.text
	// );
	logLevel.info(
		'         ---->>>>    dispatching | Action Type',
		action?.type,
		` |  Action Payload Text : `,
		action?.payload?.text,
		action
	);
	let result = await next(action);
	const latestState = await storeAPI.getState();
	logLevel.info('         ---->>>>>   next state', latestState);
	// console.log('         ---->>>>>   next state', latestState);
	return result;
};
const middlewareEnhancer = applyMiddleware(logger);

let reduxPersistenceStore;
async function getReduxPersistenceStore() {
	// clearPersistentStore();
	const contextPersistenceEnhancer = getContextPersistenceEnhancer();

	if (isUndefinedOrNull(reduxPersistenceStore)) {
		reduxPersistenceStore = await createStore(
			combinedReducer,
			preloadedState,
			compose(contextPersistenceEnhancer)
			// connectToOtherPartsEnhancer
		);
	}

	return reduxPersistenceStore;
}

export function createNormalReduxStore() {
	return createStore(combinedReducer, preloadedState);
}

export default getReduxPersistenceStore;

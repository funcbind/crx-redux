// import { configureStore } from '@reduxjs/toolkit';
import { createStore, combineReducers, compose } from 'redux';

import clipboardSettingsReducer from '../common/clipboardSettingsReducer';
import copiedItemsReducer, {
	addCopiedItem,
} from '../common/clipboardItemsReducer';
import createPersistentStore, {
	clearPersistentStore,
	applyMiddleware,
} from '../chromeStorageRedux/createPersistentStore';
import connectToOtherPartsEnhancer from '../chromeStorageRedux/connectToOtherPartsEnhancer';
import testingCounterReducer from '../common/testingCounterReducer';

console.log(`Inside store.js - Setting up redux store`);

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
	console.log('----------------->>>> dispatching', action);
	let result = await next(action);
	const latestState = await storeAPI.getState();
	console.log('----------------->>>>> next state', latestState);
	return result;
};
const middlewareEnhancer = applyMiddleware(loggerMiddleware);

export async function createTestStore() {
	clearPersistentStore();
	const store = await createPersistentStore(
		combinedReducer,
		preloadedState,
		compose(connectToOtherPartsEnhancer, middlewareEnhancer)
	);
	console.log(`Store created`, store);
	return store;
}

export default createTestStore;

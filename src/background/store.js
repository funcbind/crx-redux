// import { configureStore } from '@reduxjs/toolkit';
import { createStore, combineReducers } from 'redux';

import clipboardSettingsReducer from '../common/clipboardSettingsReducer';
import copiedItemsReducer from '../common/clipboardItemsReducer';
import createPersistentStore, {
	clearPersistentStore,
} from '../chromeStorageRedux/createPersistentStore';

const preloadedState = {
	clipboardSettings: {
		visibleOnWebPages: true,
		opacity: 0.7,
		timeToDisappear: 1000, // in ms
		fifo: true,
		clipboardMaxItems: 100, // Post which the oldest item will automatically be removed from clipboard stack
	},
	clipboardItems: [],
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
});

clearPersistentStore();
const store = createPersistentStore(combinedReducer, preloadedState);
console.log(`Store created`, store);

export default store;

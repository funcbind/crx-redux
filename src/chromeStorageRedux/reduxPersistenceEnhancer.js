import {
	getBrowserAPI,
	ActionTypes,
	getContextType,
	iterateOverContentScript,
	sendMessageToTabs,
	sendMessageToOtherContexts,
	isUndefinedOrNull,
} from './utils';
import { CHROME_STORAGE_KEY_FOR, COMMUNICATION_MESSAGE_IDS } from './constants';
import { LocalStorage } from '../chromeStorage/BrowserStorage';
import { omit } from 'lodash-es';

export default function getPersistenceStoreEnhancer(config) {
	return (createStore) => async (reducer, preLoadedState) => {
		const { keysToPersist } = config;
		const storeContext = getContextType();

		let previouslySavedState = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR.REDUX_STORE
		);
		previouslySavedState = previouslySavedState ?? {};

		const dataToInitializeReduxStoreWith = {
			...previouslySavedState,
			...(keysToPersist && omit(preLoadedState, keysToPersist)), // pick non-persisted keys from preLoadedState
		};

		const extendedReducer = extendBaseReducer(reducer);
		const store = await createStore(
			extendedReducer,
			dataToInitializeReduxStoreWith
		);

		storeUpdatesFromOtherContextsHandler(async (message) => {
			let { action, context: dispatchingContext } = message;

			// if context different from dispatching context
			if (storeContext !== dispatchingContext) {
				let latestStateFromChromeStorage = await LocalStorage.get(
					CHROME_STORAGE_KEY_FOR.REDUX_STORE
				);
				if (!isUndefinedOrNull(latestStateFromChromeStorage)) {
					store.dispatch({
						type: 'REPLACE_STATE_FROM_CHROME_STORAGE',
						payload: latestStateFromChromeStorage,
					});
				}
			}
		});

		async function dispatchWithBroadcast(action) {
			const res = store.dispatch(action);
			const latestState = store.getState();

			const stateToSaveInStorage = pick(latestState, keysToPersist);
			LocalStorage.save({
				[CHROME_STORAGE_KEY_FOR.REDUX_STORE]: stateToSaveInStorage,
			})
				.then(() => {
					broadcastMessageToOtherParts('STORE_UPDATE_BROADCAST', {
						context: storeContext,
						action,
					});
				})
				.catch((e) => {
					console.error(
						`Some error occured while saving latest state to chrome storage`,
						`Therefore, cannot broadcast this state update to other contexts`,
						`\nError : ${e}`
					);
				});

			return res;
		}

		return {
			...store,
			dispatch: dispatchWithBroadcast,
		};
	};
}

function extendBaseReducer(baseReducer) {
	return (state, action) => {
		switch (action.type) {
			case 'REPLACE_STATE_FROM_CHROME_STORAGE':
				return action.payload;
			default:
				return baseReducer(state, action);
		}
	};
}

function storeUpdatesFromOtherContextsHandler(fn) {
	const browser = getBrowserAPI();
	browser.runtime.onMessage.addListener(
		async (message, sender, sendResponse) => {
			if (message.type === COMMUNICATION_MESSAGE_IDS.STORE_UPDATE_BROADCAST) {
				fn(message);
				sendResponse(`Cool!!Thanks!!`);
				return true;
			}
		}
	);
}
async function broadcastMessageToOtherParts(broadcastMessage, broadcastData) {
	const broadcastMessageCode = COMMUNICATION_MESSAGE_IDS[broadcastMessage];

	if (!broadcastMessageCode) {
		throw new Error(
			`broadcastMessageToOtherParts() - Broadcast Message Code Not found : ${broadcastMessage}`
		);
	}

	// broadcast to content scripts
	iterateOverContentScript((tabId) => {
		sendMessageToTabs(tabId, broadcastData);
	});

	sendMessageToOtherContexts({
		type: broadcastMessageCode,
		broadcastData,
	});
}

/* eslint-disable no-undef */
import {
	getBrowserAPI,
	getContextType,
	iterateOverContentScriptTabs,
	sendMessageToTabs,
	sendMessageToOtherContexts,
	isUndefinedOrNull,
	ActionTypes,
} from './utils';
import {
	CHROME_STORAGE_KEY_FOR,
	COMMUNICATION_MESSAGE_IDS,
	EXTENSIONS_CONTEXTS,
} from './constants';
import { LocalStorage } from '../chromeStorage/BrowserStorage';
import { DeferredPromise } from '@open-draft/deferred-promise';
import logLevel from '../common/appLogger';

const appLogger = logLevel.getLogger('persistenceStoreEnhancer');
appLogger.setLevel(logLevel.levels.DEBUG);

export default function globalPersistenceEnhancer(createStore) {
	return async (reducer, preLoadedState) => {
		appLogger.info(`Inside global Persistence Enhancer`);
		chrome.runtime.onStartup.addListener(() => {
			appLogger.info(`Global Persistence Enhancer - Browser has started!!`);
		});
		const storeContext = getContextType();
		let subscriptionListeners = [];

		let previouslySavedState = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR.GLOBAL
		);
		previouslySavedState = previouslySavedState ?? {};

		const dataToInitializeReduxStoreWith = {
			...preLoadedState,
			...previouslySavedState,
		};

		const extendedReducer = extendBaseReducer(reducer);
		const store = await createStore(
			extendedReducer,
			dataToInitializeReduxStoreWith
		);

		const subscribe = getSubscribeMethod(subscriptionListeners);

		handleStoreUpdatesFromOtherContexts(
			store,
			storeContext,
			subscriptionListeners
		);

		let getState;
		let dispatch;

		if (storeContext === EXTENSIONS_CONTEXTS.BACKGROUND) {
			getState = getBackgroundContextGetState(store);
			dispatch = getDispatchForBackgroundContext(
				store,
				preLoadedState,
				subscriptionListeners
			);
			await dispatch({ type: ActionTypes.INIT });
		} else {
			getState = store.getState;
			dispatch = getDispatchForNonBackgroundContexts(
				store,
				subscriptionListeners,
				storeContext
			);
		}

		return {
			...store,
			dispatch,
			getState,
			subscribe,
		};
	};
}

const getDispatchForNonBackgroundContexts =
	(store, subscriptionListeners, storeContext) => (action) => {
		const res = store.dispatch(action);
		const latestState = store.getState();
		subscriptionListeners.forEach((l) => l());

		LocalStorage.save({
			[CHROME_STORAGE_KEY_FOR.GLOBAL]: latestState,
		})
			.then(() => {
				appLogger.trace(
					`--> Saved state to chrome storage. Now, broadcasting state update to other contexts`
				);
				broadcastMessageToOtherParts({
					type: COMMUNICATION_MESSAGE_IDS.STORE_UPDATE_BROADCAST,
					context: storeContext,
					action,
				});
			})
			.catch((e) => {
				appLogger.error(
					`Some error occured while saving latest state to chrome storage`,
					`Therefore, cannot broadcast this state update to other contexts`,
					`\nError : ${e}`
				);
			});

		return res;
	};

const getSubscribeMethod = (subscriptionListeners) => (listener) => {
	if (typeof listener !== 'function') {
		throw new Error(`Subscribe function requires a function as an argument`);
	}

	subscriptionListeners.push(listener);

	appLogger.trace(
		`Inside subscribe function - Added new Store Listener`,
		subscriptionListeners
	);
	return function unsubscribe() {
		subscriptionListeners = subscriptionListeners.filter((l) => l !== listener);
	};
};

const getBackgroundContextGetState = (store) => async () => {
	store.getState();
	const currentState = await LocalStorage.get(CHROME_STORAGE_KEY_FOR.GLOBAL);
	return currentState;
};

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

function handleStoreUpdatesFromOtherContexts(
	store,
	storeContext,
	subscriptionListeners
) {
	const browser = getBrowserAPI();
	browser.runtime.onMessage.addListener(
		async (message, sender, sendResponse) => {
			let { action, context: dispatchingContext, type: messageType } = message;
			if (
				messageType === COMMUNICATION_MESSAGE_IDS.STORE_UPDATE_BROADCAST &&
				storeContext !== dispatchingContext
			) {
				appLogger.trace(
					`handleStoreUpdatesFromOtherContexts() - Store Broadcast update : From ${dispatchingContext} context with data`,
					message
				);
				let latestStateFromChromeStorage = await LocalStorage.get(
					CHROME_STORAGE_KEY_FOR.GLOBAL
				);
				// appLogger.debug(
				// 	`handleStoreUpdatesFromOtherContexts() - Latest state from chrome storage`,
				// 	latestStateFromChromeStorage
				// );
				if (!isUndefinedOrNull(latestStateFromChromeStorage)) {
					// should work for background-worker as well
					store.dispatch({
						type: 'REPLACE_STATE_FROM_CHROME_STORAGE',
						payload: latestStateFromChromeStorage,
					});
					subscriptionListeners.forEach((l) => l());
				}
				sendResponse(`Store broadcast received & handled`);
				return true;
			}
		}
	);
}

async function broadcastMessageToOtherParts(broadcastMessage) {
	appLogger.debug(
		`broadcastMessageToOtherParts() - Broadcast Message`,
		broadcastMessage,
		broadcastMessage?.context
	);
	const { context: dispatchingContext } = broadcastMessage;
	const broadcastMessageType = broadcastMessage?.type;

	if (isUndefinedOrNull(broadcastMessageType)) {
		throw new Error(
			`broadcastMessageToOtherParts() - Broadcast Message Type Not found : ${broadcastMessage}`
		);
	}

	// cannot use chrome.tabs.sendMessage from within content scripts
	if (dispatchingContext !== EXTENSIONS_CONTEXTS.CONTENT_SCRIPT) {
		// broadcast to content scripts
		iterateOverContentScriptTabs((tabId) => {
			sendMessageToTabs(tabId, broadcastMessage);
		});
	}

	sendMessageToOtherContexts(broadcastMessage);
}

const getDispatchForBackgroundContext = (
	store,
	preLoadedState,
	subscriptionListeners
) => {
	let isPreviousDispatchExecuting = false;
	let actionQueue = []; // required - dispatch() method

	return async function backgroundContextDispatch(
		action,
		lastDeferredActionPromise
	) {
		if (isPreviousDispatchExecuting) {
			const deferredActionPromise = new DeferredPromise();
			actionQueue.push({
				action,
				promise: deferredActionPromise,
			});
			appLogger.trace(
				`dispatch() : Added latest dispatched action in queue :`,
				actionQueue.length
			);
			return deferredActionPromise;
		}

		try {
			isPreviousDispatchExecuting = true;

			// Already done for initial action
			// Meant for post init actions
			// To take care of background worker sleeping & getting reset
			if (action.type !== ActionTypes.INIT) {
				let lastPersistedState = await LocalStorage.get(
					CHROME_STORAGE_KEY_FOR.GLOBAL
				);
				lastPersistedState = lastPersistedState ?? {};
				let stateReplacementData = {
					...preLoadedState,
					...lastPersistedState,
				};

				if (isUndefinedOrNull(lastPersistedState)) {
					appLogger.warn(`Error : Last saved state is undefined or null or an empty object	
							 - Possible reason - Stored state in chrome storage might have gotten deleted
							 - So, Setting current state to preloaded or Initial state
							`);
				}
				store.dispatch({
					type: 'REPLACE_STATE_FROM_CHROME_STORAGE',
					payload: stateReplacementData,
				});
			}

			store.dispatch(action);
			const latestState = store.getState();

			await LocalStorage.save({
				[CHROME_STORAGE_KEY_FOR.GLOBAL]: latestState,
			});

			subscriptionListeners.forEach((l) => l());

			appLogger.trace(
				`--> Saved state to chrome storage. Now, broadcasting state update to other contexts`
			);

			if (action.type !== ActionTypes.INIT) {
				broadcastMessageToOtherParts({
					type: COMMUNICATION_MESSAGE_IDS.STORE_UPDATE_BROADCAST,
					context: EXTENSIONS_CONTEXTS.BACKGROUND,
					action,
				});
			}
		} catch (error) {
			// clear remaining ActionQueue in case of Error
			actionQueue = [];
			appLogger.error(`Error Obj`, error);
			throw new Error(
				`Inside DISPATCH() : 
				# Action Obj : ${JSON.stringify(action, null, 2)}
				# Error Reasons : 
					1. Error while getting current redux state from chrome storage
					2. Evaluating state from reducer by passing current state & action object
					3. Saving next state in chrome storage \n`
			);
		} finally {
			isPreviousDispatchExecuting = false;
		}

		// 2. APPROACH 2 - IF LISTENERS DON'T WORK - USE PUB SUB

		// call queued up actions
		if (actionQueue.length > 0) {
			const lastDeferredAction = actionQueue.shift();
			setTimeout(() => {
				const { action, promise: lastDeferredActionPromise } =
					lastDeferredAction;
				backgroundContextDispatch(action, lastDeferredActionPromise);
			}, 0);
		}

		return lastDeferredActionPromise
			? lastDeferredActionPromise.resolve(action)
			: Promise.resolve(action);
	};
};

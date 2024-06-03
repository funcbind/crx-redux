/* eslint-disable no-undef */
import {
	getBrowserAPI,
	getContextType,
	isUndefinedOrNull,
	ActionTypes,
} from './utils';
import { CHROME_STORAGE_KEY_FOR, EXTENSIONS_CONTEXTS } from './constants';
import { LocalStorage } from '../chromeStorage/BrowserStorage';
import { DeferredPromise } from '@open-draft/deferred-promise';
import logLevel from '../common/appLogger';
import { isEqual, pick } from 'lodash-es';

const appLogger = logLevel.getLogger('persistenceStoreEnhancer');
appLogger.setLevel(logLevel.levels.DEBUG);

appLogger.debug(`Inside contextPersistenceEnhancer.js`);
activateBrowserSessionPersistenceLevels();

function activateBrowserSessionPersistenceLevels() {
	appLogger.debug(`activateBrowserSessionPersistenceLevels()`);
	// if (isUndefinedOrNull(contextName)) {
	// 	throw new Error(`1st argument i.e context name {string} is Required`);
	// }
	const browser = getBrowserAPI();
	browser.runtime.onStartup.addListener(async () => {
		appLogger.info(`background.js - Browser has started!!`);
		// clearLocalContextPersistedState(contextName, keysToPersist);
		let browserSessionKeysForAllContexts = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR.CONTEXT_PERSISTENCE_BROWSER_SESSION_KEYS
		);
		browserSessionKeysForAllContexts = browserSessionKeysForAllContexts ?? {};

		appLogger.debug(
			`browserSessionKeysForAllContexts : `,
			browserSessionKeysForAllContexts
		);

		for (const context of Object.keys(browserSessionKeysForAllContexts)) {
			const browserSessionKeysForCurrentContext =
				browserSessionKeysForAllContexts[context];
			let localStorageAreaForCurrentContext = CHROME_STORAGE_KEY_FOR[context];
			let currentContextSavedState =
				(await LocalStorage.get(localStorageAreaForCurrentContext)) ?? {};
			// remove browser session keys from local storage
			const latestState = omit(
				currentContextSavedState,
				browserSessionKeysForCurrentContext
			);
			appLogger.debug(
				`context :`,
				context,
				`\nlatestState : `,
				latestState,
				`\nbrowserSessionKeysForCurrentContext : `,
				browserSessionKeysForCurrentContext
			);
			await LocalStorage.save({
				[localStorageAreaForCurrentContext]: latestState,
			});
		}
	});
}

const getContextPersistenceEnhancer =
	(config) => (createStore) => async (reducer, preLoadedState) => {
		const currentContext = getContextType();
		let subscriptionListeners = [];
		let contextSessionKeys = config?.contextSessionKeys;
		let browserSessionKeys = config?.browserSessionKeys;

		// leave marker for browser session persistence in chrome storage
		let savedBrowserSessionKeys =
			(await LocalStorage.get(
				CHROME_STORAGE_KEY_FOR.CONTEXT_PERSISTENCE_BROWSER_SESSION_KEYS
			)) ?? {};

		appLogger.debug(
			`Initializing context persistence enhancer : config `,
			config,
			`\nsavedBrowserSessionKeys : `,
			savedBrowserSessionKeys
		);

		let savedCurrentContextBrowserSessionKeys =
			savedBrowserSessionKeys[currentContext];

		if (!isEqual(browserSessionKeys, savedCurrentContextBrowserSessionKeys)) {
			savedBrowserSessionKeys[currentContext] = browserSessionKeys;
			await localStorage.save({
				[CHROME_STORAGE_KEY_FOR.CONTEXT_PERSISTENCE_BROWSER_SESSION_KEYS]:
					savedBrowserSessionKeys,
			});
		}

		const storageAreaForCurrentContext = CHROME_STORAGE_KEY_FOR[currentContext];

		appLogger.debug(
			`Local Persistence Enhancer - Chrome Storage Key For Local Context : 
			${storageAreaForCurrentContext}, context : ${currentContext}`
		);

		let previouslySavedState = await LocalStorage.get(
			storageAreaForCurrentContext
		);
		previouslySavedState = previouslySavedState ?? {};

		const dataToInitializeReduxStoreWith = {
			...preLoadedState,
			...previouslySavedState,
		};

		appLogger.debug(`previouslySavedState : `, previouslySavedState);
		const extendedReducer = extendBaseReducer(reducer);
		const store = await createStore(
			extendedReducer,
			dataToInitializeReduxStoreWith
		);

		const subscribe = getSubscribeMethod(subscriptionListeners);

		let getState;
		let dispatch;

		if (currentContext === EXTENSIONS_CONTEXTS.BACKGROUND) {
			getState = getBackgroundContextGetState(
				store,
				storageAreaForCurrentContext
			);
			dispatch = getDispatchForBackgroundContext(
				store,
				preLoadedState,
				subscriptionListeners,
				storageAreaForCurrentContext,
				contextSessionKeys
			);
			await dispatch({ type: ActionTypes.INIT });
		} else {
			getState = store.getState;
			dispatch = getDispatchForNonBackgroundContexts(
				store,
				subscriptionListeners,
				storageAreaForCurrentContext,
				contextSessionKeys
			);
		}
		return {
			...store,
			dispatch,
			getState,
			subscribe,
		};
	};

export default getContextPersistenceEnhancer;

export const clearLocalContextPersistedState = async (
	contextName,
	keysToPersist
) => {
	appLogger.info(`Clearing local background state`);
	LocalStorage.delete(CHROME_STORAGE_KEY_FOR.BACKGROUND);

	let localBackgroundState = await LocalStorage.get(
		CHROME_STORAGE_KEY_FOR.BACKGROUND
	);

	localBackgroundState = localBackgroundState ?? {};

	if (keysToPersist && Array.isArray(keysToPersist)) {
		localBackgroundState = pick(localBackgroundState, keysToPersist);

		await LocalStorage.save({
			[CHROME_STORAGE_KEY_FOR.BACKGROUND]: localBackgroundState,
		});
	} else {
		LocalStorage.delete(CHROME_STORAGE_KEY_FOR.BACKGROUND);
	}
};

const getDispatchForNonBackgroundContexts =
	(
		store,
		subscriptionListeners,
		storageAreaForCurrentContext,
		contextSessionKeys
	) =>
	(action) => {
		const res = store.dispatch(action);
		let latestState = store.getState();
		subscriptionListeners.forEach((l) => l());

		// Pick only those keys from latest state that need to be persisted
		if (contextSessionKeys && Array.isArray(contextSessionKeys)) {
			latestState = omit(latestState, contextSessionKeys);
		}

		LocalStorage.save({
			[storageAreaForCurrentContext]: latestState,
		}).catch((e) => {
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

const getBackgroundContextGetState =
	(store, chromeStorageKeyForLocalContext) => async () => {
		store.getState();
		const currentState = await LocalStorage.get(
			chromeStorageKeyForLocalContext
		);
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

const getDispatchForBackgroundContext = (
	store,
	preLoadedState,
	subscriptionListeners,
	chromeStorageKeyForLocalContext
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
					chromeStorageKeyForLocalContext
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
				[chromeStorageKeyForLocalContext]: latestState,
			});

			subscriptionListeners.forEach((l) => l());

			appLogger.trace(
				`--> Saved state to chrome storage. Now, broadcasting state update to other contexts`
			);
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

/* eslint-disable no-undef */
import {
	shallowDiff,
	kindOf,
	ActionTypes,
	isPlainObject,
	$$observable,
	getBrowserAPI,
} from './utils.js';
import { DeferredPromise } from '@open-draft/deferred-promise';
import { LocalStorage } from '../chromeStorage/storageLib.js';
// import { onMessage, sendMessage } from 'webext-bridge/background';
import {
	COMMUNICATION_MESSAGE_IDS,
	EXTENSIONS_CONTEXTS,
	CHROME_STORAGE_KEY_FOR,
	CHROME_REDUX_CONSTANTS,
} from './contants.js';

const defaultOpts = {
	diffStrategy: shallowDiff,
};

export default async function createPersistentStore(
	reducer,
	preloadedState,
	enhancer
) {
	if (typeof reducer !== 'function') {
		throw new Error(
			`Expected the root reducer to be a function. Instead, received: '${kindOf(
				reducer
			)}'`
		);
	}

	if (
		(typeof preloadedState === 'function' && typeof enhancer === 'function') ||
		(typeof enhancer === 'function' && typeof arguments[3] === 'function')
	) {
		throw new Error(
			'It looks like you are passing several store enhancers to ' +
				'createStore(). This is not supported. Instead, compose them ' +
				'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.'
		);
	}

	if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
		enhancer = preloadedState;
		preloadedState = undefined;
	}

	if (typeof enhancer !== 'undefined') {
		if (typeof enhancer !== 'function') {
			throw new Error(
				`Expected the enhancer to be a function. Instead, received: '${kindOf(
					enhancer
				)}'`
			);
		}

		return enhancer(createPersistentStore)(reducer, preloadedState);
	}

	let currentReducer = reducer;
	let currentState = preloadedState;
	let currentListeners = new Map();
	let actionQueue = [];
	let nextListeners = currentListeners;
	let listenerIdCounter = 0;
	let isReducerExecuting = false;
	let isPreviousDispatchExecuting = false;

	/**
	 * This makes a shallow copy of currentListeners so we can use
	 * nextListeners as a temporary list while dispatching.
	 *
	 * This prevents any bugs around consumers calling
	 * subscribe/unsubscribe in the middle of a dispatch.
	 */
	function ensureCanMutateNextListeners() {
		if (nextListeners === currentListeners) {
			nextListeners = new Map();
			currentListeners.forEach((listener, key) => {
				nextListeners.set(key, listener);
			});
		}
	}

	/**
	 * Reads the state tree managed by the store.
	 *
	 * @returns The current state tree of your application.
	 */
	async function getState() {
		// This check is added here to prevent calling getState from within a reducer
		// i.e when dispatch is still in progress

		if (isReducerExecuting) {
			throw new Error(
				'You may not call store.getState() while the reducer is executing. ' +
					'The reducer has already received the state as an argument. ' +
					'Pass it down from the top reducer instead of reading it from the store.'
			);
		}

		const currentState = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR.REDUX_STORE
		);

		return currentState;
	}

	/**
	 * Adds a change listener. It will be called any time an action is dispatched,
	 * and some part of the state tree may potentially have changed. You may then
	 * call `getState()` to read the current state tree inside the callback.
	 *
	 * You may call `dispatch()` from a change listener, with the following
	 * caveats:
	 *
	 * 1. The subscriptions are snapshotted just before every `dispatch()` call.
	 * If you subscribe or unsubscribe while the listeners are being invoked, this
	 * will not have any effect on the `dispatch()` that is currently in progress.
	 * However, the next `dispatch()` call, whether nested or not, will use a more
	 * recent snapshot of the subscription list.
	 *
	 * 2. The listener should not expect to see all state changes, as the state
	 * might have been updated multiple times during a nested `dispatch()` before
	 * the listener is called. It is, however, guaranteed that all subscribers
	 * registered before the `dispatch()` started will be called with the latest
	 * state by the time it exits.
	 *
	 * @param listener A callback to be invoked on every dispatch.
	 * @returns A function to remove this change listener.
	 */
	function subscribe(listener) {
		console.debug(`subscribe() - listener`, listener, isReducerExecuting);
		if (typeof listener !== 'function') {
			throw new Error(
				`Expected the listener to be a function. Instead, received: '${kindOf(
					listener
				)}'`
			);
		}

		if (isReducerExecuting) {
			throw new Error(
				'You may not call store.subscribe() while the reducer is executing. ' +
					'If you would like to be notified after the store has been updated, subscribe from a ' +
					'component and invoke store.getState() in the callback to access the latest state. ' +
					'See https://redux.js.org/api/store#subscribelistener for more details.'
			);
		}

		let isSubscribed = true;

		ensureCanMutateNextListeners();
		const listenerId = listenerIdCounter++;
		nextListeners.set(listenerId, listener);

		return function unsubscribe() {
			if (!isSubscribed) {
				return;
			}

			if (isReducerExecuting) {
				throw new Error(
					'You may not unsubscribe from a store listener while the reducer is executing. ' +
						'See https://redux.js.org/api/store#subscribelistener for more details.'
				);
			}

			isSubscribed = false;

			ensureCanMutateNextListeners();
			nextListeners.delete(listenerId);
			currentListeners = null;
		};
	}

	/**
	 * Dispatches an action. It is the only way to trigger a state change.
	 *
	 * The `reducer` function, used to create the store, will be called with the
	 * current state tree and the given `action`. Its return value will
	 * be considered the **next** state of the tree, and the change listeners
	 * will be notified.
	 *
	 * The base implementation only supports plain object actions. If you want to
	 * dispatch a Promise, an Observable, a thunk, or something else, you need to
	 * wrap your store creating function into the corresponding middleware. For
	 * example, see the documentation for the `redux-thunk` package. Even the
	 * middleware will eventually dispatch plain object actions using this method.
	 *
	 * @param action A plain object representing “what changed”. It is
	 * a good idea to keep actions serializable so you can record and replay user
	 * sessions, or use the time travelling `redux-devtools`. An action must have
	 * a `type` property which may not be `undefined`. It is a good idea to use
	 * string constants for action types.
	 *
	 * @returns For convenience, the same action object you dispatched.
	 *
	 * Note that, if you use a custom middleware, it may wrap `dispatch()` to
	 * return something else (for example, a Promise you can await).
	 */
	async function dispatch(action, lastDeferredActionPromise) {
		const isInitializationAction = action.type === ActionTypes.INIT;
		// console.log(
		// 	`DISPATCH() : NEW ACTION DISPATCHED	 : \n`,
		// 	JSON.stringify(action, null, 4)
		// );
		if (!isPlainObject(action)) {
			throw new Error(
				`DISPATCH() : Actions must be plain objects. Instead, the actual type was: '${kindOf(
					action
				)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
			);
		}

		if (typeof action.type === 'undefined') {
			throw new Error(
				'DISPATCH() : Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
			);
		}

		if (typeof action.type !== 'string') {
			throw new Error(
				`DISPATCH() : Action "type" property must be a string. Instead, the actual type was: '${kindOf(
					action.type
				)}'. Value was: '${action.type}' (stringified)`
			);
		}

		if (isReducerExecuting) {
			throw new Error('Reducers may not dispatch actions.');
		}

		if (isPreviousDispatchExecuting) {
			const deferredActionPromise = new DeferredPromise();
			actionQueue.push({
				action,
				promise: deferredActionPromise,
			});
			// console.log(
			// 	`DISPATCH() : Previous dispatch in progress -> Adding latest dispatched action in queue :`,
			// 	JSON.stringify(action, null, 4),
			// 	`\nAction Queue : `,
			// 	actionQueue
			// );
			return deferredActionPromise;
		}

		//get current state from chrome storage or preLoadedState
		let nextState;
		try {
			isPreviousDispatchExecuting = true;

			let lastPersistedState = await LocalStorage.get(
				CHROME_STORAGE_KEY_FOR.REDUX_STORE
			);

			let nonExistentPersistedState =
				typeof lastPersistedState === 'undefined' ||
				lastPersistedState === null;

			// lastPersistedState can be undefined or null in 2 cases
			// Case 1 - Stored state in chrome storage might have gotten deleted inadverdently
			// Case 2 - Firstmost type INIT Dispatch action
			if (nonExistentPersistedState) {
				console.warn(`Error : Last saved state is undefined or null or an empty object	
						     - Possible reason - Stored state in chrome storage might have gotten deleted
							 - So, Setting current state to preloaded or Initial state
							`);
				currentState = preloadedState;
			} else {
				currentState = lastPersistedState;
			}
			// console.log(
			// 	`DISPATCH() : Getting Current State from chrome storage get evaluate new state using reducer : `,
			// 	currentState
			// );

			try {
				isReducerExecuting = true;
				nextState = currentReducer(currentState, action);
			} finally {
				isReducerExecuting = false;
			}
			// console.log(
			// 	`DISPATCH() : Next state evaluated by calling reducer function : `,
			// 	nextState
			// );

			if (isInitializationAction) {
				// console.log(
				// 	`DISPATCH() : INIT Dispatch case : `,
				// 	nextState, lastPersistedState, nonExistentPersistedState
				// );

				// 1. Handles firstmost INIT case when there's no stored redux state
				// 2. Handles case when Stored redux state is deleted inadverdently or lost due to some
				// programmatical error
				if (nonExistentPersistedState) {
					await LocalStorage.save({
						[CHROME_STORAGE_KEY_FOR.REDUX_STORE]: nextState,
					});
				}
			} else if (nextState !== currentState) {
				await LocalStorage.save({
					[CHROME_STORAGE_KEY_FOR.REDUX_STORE]: nextState,
				});
			} else {
				// console.log(
				// 	`DISPATCH() : Next state is same as current state & its not INIT Dispatch `,
				// 	nextState === currentState
				// );
			}
			throw new Error('Testing await dispatch in case of failure....');
		} catch (e) {
			throw new Error(`DISPATCH() : 
				# Action Obj : ${JSON.stringify(action)}
				# Error Reasons : 
					1. Error while getting current redux state from chrome storage
					2. Evaluating state from reducer by passing current state & action object
					3. Saving next state in chrome storage \n
				# Error Details -> ${e}
			`);
		} finally {
			isPreviousDispatchExecuting = false;
		}

		// For now - calling listeners after every dispatch/state
		// console.log(
		// 	`DISPATCH() : Calling listeners functions post dispatch completion`
		// );

		const listeners = (currentListeners = nextListeners);
		// 1. APPROACH 1 - IF LISTENERS WORK
		listeners.forEach((listener) => {
			listener();
		});

		broadcastStoreSubscription();

		// 2. APPROACH 2 - IF LISTENERS DON'T WORK - USE PUB SUB

		// call queued up actions
		if (actionQueue.length > 0) {
			const lastDeferredAction = actionQueue.shift();
			// console.log(
			// 	`DISPATCH() : retrieving deferred actions from dispatch queue and dispatching them`,
			// 	JSON.stringify(lastDeferredAction, null, 4)
			// );
			// Moving out of current thread so that the original called dispatch can return promise
			// and doesn't get into loop of dispatching
			setTimeout(() => {
				// console.log(
				// 	`Calling pending actions from queue`,
				// 	JSON.stringify(lastDeferredAction, null, 4)
				// );
				const { action, promise: lastDeferredActionPromise } =
					lastDeferredAction;
				dispatch(action, lastDeferredActionPromise);
			}, 0);
		}

		return lastDeferredActionPromise
			? lastDeferredActionPromise.resolve(action)
			: action;
	}

	/**
	 * Replaces the reducer currently used by the store to calculate the state.
	 *
	 * You might need this if your app implements code splitting and you want to
	 * load some of the reducers dynamically. You might also need this if you
	 * implement a hot reloading mechanism for Redux.
	 *
	 * @param nextReducer The reducer for the store to use instead.
	 */
	function replaceReducer(nextReducer) {
		if (typeof nextReducer !== 'function') {
			throw new Error(
				`Expected the nextReducer to be a function. Instead, received: '${kindOf(
					nextReducer
				)}`
			);
		}

		currentReducer = nextReducer;

		// This action has a similar effect to ActionTypes.INIT.
		// Any reducers that existed in both the new and old rootReducer
		// will receive the previous state. This effectively populates
		// the new state tree with any relevant data from the old one.
		dispatch({ type: ActionTypes.REPLACE });
	}

	/**
	 * Interoperability point for observable/reactive libraries.
	 * @returns A minimal observable of state changes.
	 * For more information, see the observable proposal:
	 * https://github.com/tc39/proposal-observable
	 */
	function observable() {
		const outerSubscribe = subscribe;
		return {
			/**
			 * The minimal observable subscription method.
			 * @param observer Any object that can be used as an observer.
			 * The observer object should have a `next` method.
			 * @returns An object with an `unsubscribe` method that can
			 * be used to unsubscribe the observable from the store, and prevent further
			 * emission of values from the observable.
			 */
			subscribe(observer) {
				if (typeof observer !== 'object' || observer === null) {
					throw new TypeError(
						`Expected the observer to be an object. Instead, received: '${kindOf(
							observer
						)}'`
					);
				}

				function observeState() {
					const observerAsObserver = observer;
					if (observerAsObserver.next) {
						observerAsObserver.next(getState());
					}
				}

				observeState();
				const unsubscribe = outerSubscribe(observeState);
				return { unsubscribe };
			},

			[$$observable]() {
				return this;
			},
		};
	}

	/* 
		When a store is created, an "INIT" action is dispatched so that every
		reducer returns their initial state. This effectively populates
		the initial state tree. 
	*/
	await removeAllSavedActiveContexts();
	await dispatch({ type: ActionTypes.INIT });
	// enableStoreMethodAccessFromOtherContexts(dispatch, getState);
	// storeExistenceCheckerFromOtherParts(subscribe);
	const browserAPI = getBrowserAPI();
	connectWithOtherExtensionParts(browserAPI, getState, subscribe, dispatch);
	// precautionary step to make sure store ready message reaches to content scripts
	// in case store readiness message from port connection ( sendBackgroundStoreConnectedUpdate ())
	// fails

	sendStoreReadyUpdateToAllContentScripts(browserAPI);

	const store = {
		dispatch: dispatch,
		subscribe,
		getState,
		replaceReducer,
		[$$observable]: observable,
	};
	return store;
}

// Listening to dispatch calls from other parts of chrome extensions
// Private method - don't expose it

function connectWithOtherExtensionParts(
	browserAPI,
	getState,
	subscribe,
	dispatch
) {
	browserAPI.runtime.onConnect.addListener(async (port) => {
		const portName = port.name;
		if (
			portName.includes(
				CHROME_REDUX_CONSTANTS.BACKGROUND_STORE_CONNECTION_PORT_NAME
			)
		) {
			const [, connectedExtensionContext] = portName.split(`-`);
			console.log(
				`Other extension part connected successfully with the background store`,
				port
			);
			const { sender } = port;

			// Strategy 2.0 2nd Implementation for getState (Updating State) & subscription broadcasting
			await sendLatestStateUpdates(port, getState, subscribe); // For strategy 2.0
			// Strategy 1.0 - Sending latest state updates are not required
			sendBackgroundStoreReadyUpdate(port);

			addRemoveActiveContextFromStorage(connectedExtensionContext, sender);
			port.onDisconnect.addListener(() => {
				addRemoveActiveContextFromStorage(sender, true);
			});
			port.onMessage.addListener((message) =>
				postOnMessageHandler(message, dispatch)
			);
		}
	});
}

function postOnMessageHandler(message, dispatch) {
	console.log(`postOnMessageHandler() - Message Received`, message);
	const { type, action } = message;

	if (type === COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE) {
		dispatch(action);
	}
}

/**
 * STRATEGY 1 - Implementation
 * - For passing state updates & subscription broadcast to proxy store
 */

async function addRemoveActiveContextFromStorage(
	connectedExtensionContext,
	sender,
	removeDisconnectedContext = false
) {
	const senderTabId = sender?.tab?.id;
	const currentActiveContext =
		connectedExtensionContext === EXTENSIONS_CONTEXTS.CONTENT_SCRIPT
			? `${EXTENSIONS_CONTEXTS.CONTENT_SCRIPT}@${senderTabId}`
			: connectedExtensionContext;

	console.log(
		`addRemoveActiveContextFromStorage() - Saving or Removing Opened/Closed Active Context\n`,
		`Current Active Context is : `,
		currentActiveContext,
		`Sender Tab Id is : `,
		senderTabId,
		`Active context to add/remove :`,
		removeDisconnectedContext
	);

	try {
		let savedActiveContexts = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR.ACTIVE_EXTENSION_CONTEXTS
		);

		console.log(
			`addRemoveActiveContextFromStorage() - Already saved active contexts : `,
			savedActiveContexts
		);
		savedActiveContexts = savedActiveContexts ?? [];

		if (!Array.isArray(savedActiveContexts))
			throw new Error(`Saved Active Contexts should be an Array`);

		if (!removeDisconnectedContext) {
			if (!savedActiveContexts.includes(currentActiveContext)) {
				savedActiveContexts.push(currentActiveContext);
			}
		} else {
			savedActiveContexts = savedActiveContexts.filter(
				(aC) => aC !== currentActiveContext
			);
			console.log(`Removing active context - `, currentActiveContext);
		}
		await LocalStorage.save({
			[CHROME_STORAGE_KEY_FOR.ACTIVE_EXTENSION_CONTEXTS]: savedActiveContexts,
		});
	} catch (error) {
		console.error(
			`Some error occurred whie saving or removing active context from chrome storage`,
			error
		);
	}
}

async function broadcastStoreSubscription() {
	const browserAPI = getBrowserAPI();

	let savedActiveContexts = await LocalStorage.get(
		CHROME_STORAGE_KEY_FOR.ACTIVE_EXTENSION_CONTEXTS
	);

	console.log(
		`broadcastStoreSubscription() - Broadcasting store subscription to other contexts\n`,
		`Saved Active contexts :`,
		savedActiveContexts
	);

	savedActiveContexts = savedActiveContexts ?? [];

	if (savedActiveContexts.length) {
		const contentScriptSavedContexts = savedActiveContexts.filter(
			(savedContexts) => {
				console.log(
					`broadcastStoreSubscription() - Saved contexts for content scripts checking : `,
					savedContexts
				);
				return savedContexts.includes(EXTENSIONS_CONTEXTS.CONTENT_SCRIPT);
			}
		);
		const nonContentScriptSavedContexts = savedActiveContexts.filter(
			(savedContexts) => {
				console.log(
					`broadcastStoreSubscription() - Saved contexts for other contexts checking : `,
					savedContexts
				);
				return !savedContexts.includes(EXTENSIONS_CONTEXTS.CONTENT_SCRIPT);
			}
		);

		// have to send message to all content scripts individually using tab id
		contentScriptSavedContexts.forEach((activeContext) => {
			// context is content script
			if (activeContext.includes(EXTENSIONS_CONTEXTS.CONTENT_SCRIPT)) {
				const [, tabId] = activeContext.split('@');
				console.log(
					`broadcastStoreSubscription() - Broadcasting store subscription to CONTENT SCRIPT active contexts\n`,
					`Content Script Tab Id : `,
					tabId
				);

				if (typeof tabId === 'string') {
					browserAPI.tabs.sendMessage(
						tabId,
						{
							type: COMMUNICATION_MESSAGE_IDS.BACKGROUND_SUBSCRIPTION_BROADCAST,
						},
						() => {
							if (chrome.runtime.lastError) {
								// do nothing - errors can be present
								// if no content script exists on reciever
							}
						}
					);
				}
			}
		});

		// FOR POPUP, DEVTOOLS & OPTIONS - Just need to send one message & all of them will receive it
		if (nonContentScriptSavedContexts.length) {
			console.log(
				`broadcastStoreSubscription() - Broadcasting store subscription to POPUP, OPTIONS OR DEVTOOLS active contexts\n`
			);
			browserAPI.runtime.sendMessage({
				type: COMMUNICATION_MESSAGE_IDS.BACKGROUND_SUBSCRIPTION_BROADCAST,
			});
		}
	}
}

async function removeAllSavedActiveContexts() {
	console.log(`Removing all saved active contexts from chrome storage`);
	await LocalStorage.save({
		[CHROME_STORAGE_KEY_FOR.ACTIVE_EXTENSION_CONTEXTS]: [],
	});
}
/**
 * STRATEGY 2 - Implementation
 * - For passing state updates & subscription broadcast to proxy store
 */

function sendBackgroundStoreReadyUpdate(port) {
	console.log(
		`sendBackgroundStoreReadyUpdate() - sending background state ready update post successful port connection with background store`
	);
	port.postMessage({
		type: COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_READY,
	});
}

// Strategy 2.0 - for getState (Updating State) & subscription broadcasting
async function sendLatestStateUpdates(port, getState, subscribe) {
	let prevState = await getState();

	console.log(
		`sendLatestStateUpdates() - STRATEGY 2.0 - sending latest state updates update post
		 successful port connection with background store and also on every store subscription`,
		`prevState : `,
		prevState
	);

	const patchState = () => {
		const state = getState();
		const diff = defaultOpts.diffStrategy(prevState, state);

		if (diff.length) {
			prevState = state;

			port.postMessage({
				type: COMMUNICATION_MESSAGE_IDS.PATCH_STATE_TYPE,
				payload: diff,
			});
		}
	};

	const unsubscribe = subscribe(patchState);
	// when the port disconnects, unsubscribe the sendState listener
	port.onDisconnect.addListener(unsubscribe);

	// Send store's initial state through port
	port.postMessage({
		type: COMMUNICATION_MESSAGE_IDS.STATE_TYPE,
		payload: prevState,
	});
}

/**   STRATEGY IMPEMENTATION ENDING   ***/

/**
 * precautionary step
 * Safety message to tabs for content scripts
 * For store readiness message
 */
function sendStoreReadyUpdateToAllContentScripts(browserAPI) {
	browserAPI.tabs.query({}, (tabs) => {
		for (const tab of tabs) {
			browserAPI.tabs.sendMessage(
				tab.id,
				{
					type: COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_READY,
					portName:
						CHROME_REDUX_CONSTANTS.BACKGROUND_STORE_CONNECTION_PORT_NAME,
				},
				() => {
					if (chrome.runtime.lastError) {
						// do nothing - errors can be present
						// if no content script exists on reciever
					}
				}
			);
		}
	});
}

// For testing purposes only

export async function clearPersistentStore() {
	console.log(`Clearing all previous state in chrome storage`);
	await LocalStorage.delete([
		CHROME_STORAGE_KEY_FOR.REDUX_STORE,
		CHROME_STORAGE_KEY_FOR.IS_REDUX_STORE_INITIALIZED,
	]);
}

/*********************************
	Deprecated / Disabled Functions
*************************************/

function enableStoreMethodAccessFromOtherContexts(dispatch, getState) {
	console.log(
		`enableStoreMethodAccessFromOtherContexts() - enabling store access method access from other parts of chrome extension`
	);

	// DISPATCH METHOD ACCESS
	onMessage(
		COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE,
		async (communicationObj) => {
			const { data: action } = communicationObj;
			// console.log(
			// 	`enableStoreMethodAccessFromOtherContexts() - Inside dispatch Listener : `,
			// 	action
			// );
			let responseObj = {};
			try {
				responseObj.data = await dispatch(action);
			} catch (error) {
				responseObj.error = error;
			}
			return action;
		}
	);

	// GET_STATE METHOD ACCESS
	onMessage(
		COMMUNICATION_MESSAGE_IDS.GET_LATEST_STORE_STATE,
		async (message) => {
			const executionContext = message?.sender?.context;
			// console.log(`createPersistentStore.js : Inside getState Listener`);
			let responseObj = {};
			try {
				responseObj.data = await getState();
			} catch (error) {
				responseObj.error = error;
				console.error(
					`Error while getting latest state from ${executionContext}\n`,
					error
				);
				throw new Error(error);
			}
			return responseObj;
		}
	);
}

/* If the below function executes, then that means background store instance exists
That means store has been created using createPersistent Store somewhere in the
background context */

function storeExistenceCheckerFromOtherParts(subscribe) {
	onMessage(
		COMMUNICATION_MESSAGE_IDS.CHECK_STORE_EXISTENCE,
		function (message) {
			const sender = message?.sender;

			console.log(
				`enableStoreSubscriptionBroadcast() - enabling store subscription broadcast`,
				message,
				`\nSender Details : `,
				sender
			);

			const extensionContext = message?.sender?.context;
			const tabId = message?.sender?.tabId;

			if (!extensionContext) {
				throw new Error(
					`enableStoreSubscriptionBroadcast - Extension context not found`
				);
			}

			if (
				(extensionContext === EXTENSIONS_CONTEXTS.CONTENT_SCRIPT ||
					extensionContext === EXTENSIONS_CONTEXTS.DEVTOOLS) &&
				!tabId
			) {
				throw new Error(
					`createPersistentStore() - Unable to enable store subscription for ${extensionContext} as tabId is missing`
				);
			}

			const unsubscribe = subscribe(() =>
				legacyBroadcastStoreSubscription(extensionContext, tabId)
			);

			//todo
			// Clear subscription either on context close or function recall - Think & Decide

			return true;
		}
	);
}

// function legacyBroadcastStoreSubscription(extensionContext, tabId = '') {
// 	extensionContext = `${extensionContext}${tabId ? '@' + tabId : ''}`;
// 	// console.log(
// 	// 	`broadcastStoreSubscription() - Broadcasting store changes to ${extensionContext}`
// 	// );
// 	sendMessage(
// 		COMMUNICATION_MESSAGE_IDS.SUBSCRIBE_TO_STORE_CHANGES,
// 		{},
// 		extensionContext
// 	);
// }

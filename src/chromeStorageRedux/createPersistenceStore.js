/* eslint-disable no-undef */

import { kindOf, ActionTypes, isPlainObject, $$observable } from './utils';
import { compose } from 'redux';
import { DeferredPromise } from '@open-draft/deferred-promise';
import { LocalStorage } from '../chromeStorage/BrowserStorage';
// import browser from 'webextension-polyfill';
import { CHROME_STORAGE_KEY_FOR } from './constants';
import logLevel from '../common/appLogger';

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

	let currentReducer = reducer; // required - for replaceReducer() - otherwise we can remove it
	// let currentState = preloadedState; //
	let currentListeners = new Map();
	let nextListeners = currentListeners;
	let listenerIdCounter = 0;
	let isReducerExecuting = false; // required - dispatch(), getState(), subscribe(), unsubscribe()
	let actionQueue = []; // required - dispatch() method
	let isPreviousDispatchExecuting = false; // required dispatch method()

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
	async function dispatch(action, lastDeferredActionPromise, executionContext) {
		const isInitializationAction = action.type === ActionTypes.INIT;
		// console.log(
		// 	`${
		// 		lastDeferredActionPromise
		// 			? 'DISPATCH() : DEFERRED ACTION DISPATCHED'
		// 			: 'DISPATCH() : NEW ACTION DISPATCHED'
		// 	} : \n`,
		// 	JSON.stringify(action, null, 4)
		// );
		if (!isPlainObject(action)) {
			throw new Error(
				`DISPATCH() : Actions must be plain objects. Instead, the actual type was: '${kindOf(
					action
				)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
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
			console.log(
				`dispatch() : Added latest dispatched action in queue :`,
				actionQueue.length
			);
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
			let currentState;

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

			// if (!isInitializationAction) {
			// 	throw new Error(`Testing dispatching broadcast erroring case...`);
			// }

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
		} catch (e) {
			// clear remaining ActionQueue in case of Error
			actionQueue = [];
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

		// required for late store creation - After proxyStore has been created
		// To inform proxyStore that background store is now ready
		// if (isInitializationAction) {
		// 	broadcastMessageToOtherParts(
		// 		'STORE_SUBSCRIPTION_BROADCAST',
		// 		{
		// 			context: executionContext,
		// 			action,
		// 		},
		// 		isInitializationAction
		// 	);
		// }
		// broadcastStoreSubscriptionToActiveContexts(action);

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
			: Promise.resolve(action);
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
	// await removeAllSavedActiveContexts();
	await dispatch({ type: ActionTypes.INIT });

	// connectWithOtherExtensionParts();
	// listenToStoreExistenceCallFromOtherContexts();
	// listenToDispatchCallsFromOtherContexts(dispatch);

	const store = {
		dispatch: dispatch,
		subscribe,
		getState: getState,
		replaceReducer,
		[$$observable]: observable,
	};
	return store;
}

// For testing purposes only

export async function clearPersistentStore() {
	logLevel.info(`Clearing all previous state in chrome storage`);
	await LocalStorage.delete([
		CHROME_STORAGE_KEY_FOR.REDUX_STORE,
		CHROME_STORAGE_KEY_FOR.IS_REDUX_STORE_INITIALIZED,
		CHROME_STORAGE_KEY_FOR.ACTIVE_EXTENSION_CONTEXTS,
	]);
}

/**
 * Modified applyMiddleware enhancer
 * instead of create store we are using await create store
 * Rest all is same
 *
 * @param  {...any} middlewares Middleware Arguments
 * @returns
 */
export function applyMiddleware(...middlewares) {
	return (createStore) => async (reducer, preloadedState) => {
		const store = await createStore(reducer, preloadedState);
		let dispatch = () => {
			throw new Error(
				process.env.NODE_ENV === 'production'
					? _formatProdErrorMessage(15)
					: 'Dispatching while constructing your middleware is not allowed. ' +
					  'Other middleware would not be applied to this dispatch.'
			);
		};
		const middlewareAPI = {
			getState: store.getState,
			dispatch: (action, ...args) => dispatch(action, ...args),
		};
		const chain = middlewares.map((middleware) => middleware(middlewareAPI));
		dispatch = compose(...chain)(store.dispatch);
		return {
			...store,
			dispatch,
		};
	};
}

export function formatProdErrorMessage(code) {
	return (
		`Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or ` +
		'use the non-minified dev environment for full errors. '
	);
}

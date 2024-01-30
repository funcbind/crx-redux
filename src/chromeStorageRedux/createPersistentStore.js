import { kindOf, ActionTypes, isPlainObject, $$observable } from './utils.js';
import { DeferredPromise } from '@open-draft/deferred-promise';
import { LocalStorage } from '../chromeStorageInterface/storageLib.js';

const CHROME_STORAGE_KEY_FOR_REDUX_STATE = '__REDUX_STATE__';

export default function createPersistentStore(
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
	let isDispatching = false;

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
		if (isDispatching) {
			throw new Error(
				'You may not call store.getState() while the reducer is executing. ' +
					'The reducer has already received the state as an argument. ' +
					'Pass it down from the top reducer instead of reading it from the store.'
			);
		}

		const currentState = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR_REDUX_STATE
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
		console.debug(`Inside subscribe listener`, listener, isDispatching);
		if (typeof listener !== 'function') {
			throw new Error(
				`Expected the listener to be a function. Instead, received: '${kindOf(
					listener
				)}'`
			);
		}

		if (isDispatching) {
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

			if (isDispatching) {
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
	async function dispatch(action, deferredActionPromise) {
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

		if (isDispatching) {
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
			// throw new Error('Reducers may not dispatch actions.');
		}

		//get current state from chrome storage or preLoadedState

		try {
			isDispatching = true;
			if (action.type !== ActionTypes.INIT) {
				currentState = await LocalStorage.get(
					CHROME_STORAGE_KEY_FOR_REDUX_STATE
				);
				// console.log(
				// 	`DISPATCH() : Getting Current State from chrome storage get evaluate new state using reducer : `,
				// 	currentState
				// );
			}
			let nextState = currentReducer(currentState, action);
			// console.log(
			// 	`DISPATCH() : Next state evaluated by calling reducer function : `,
			// 	nextState
			// );

			if (nextState !== currentState || action.type === ActionTypes.INIT) {
				// save next state in chrome storage
				await LocalStorage.save(CHROME_STORAGE_KEY_FOR_REDUX_STATE, nextState);
				// console.log(
				// 	`DISPATCH() : Next state successfully saved inside chrome storage : `,
				// 	nextState
				// );
			} else {
				// console.log(
				// 	`DISPATCH() : Next state is same as current state : `,
				// 	nextState === currentState
				// );
			}
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
			isDispatching = false;
			deferredActionPromise?.resolve();
		}

		// For now - calling listeners after every dispatch/state
		// console.log(
		// 	`DISPATCH() : Calling listeners functions post dispatch completion`
		// );
		const listeners = (currentListeners = nextListeners);
		listeners.forEach((listener) => {
			listener();
		});

		// call queued up actions
		if (actionQueue.length > 0) {
			const lastDeferredAction = actionQueue.shift();
			// console.log(
			// 	`DISPATCH() : retrieving deferred actions from dispatch queue and dispatching them`,
			// 	JSON.stringify(lastDeferredAction, null, 4)
			// );
			// Moving out of current thread so that the current dispatch can return & end.
			setTimeout(() => {
				// console.log(
				// 	`Calling pending actions from queue`,
				// 	JSON.stringify(lastDeferredAction, null, 4)
				// );
				const { action, promise: deferredActionPromise } = lastDeferredAction;
				dispatch(action, deferredActionPromise);
			}, 0);
		}

		return action;
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

	// When a store is created, an "INIT" action is dispatched so that every
	// reducer returns their initial state. This effectively populates
	// the initial state tree.
	dispatch({ type: ActionTypes.INIT });

	const store = {
		dispatch: dispatch,
		subscribe,
		getState,
		replaceReducer,
		[$$observable]: observable,
	};
	return store;
}

// For testing purposes only
export async function clearPersistentStore() {
	console.log(`Clearing all previous state in chrome storage`);
	await LocalStorage.delete(CHROME_STORAGE_KEY_FOR_REDUX_STATE);
}

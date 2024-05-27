import {
	kindOf,
	ActionTypes,
	isPlainObject,
	$$observable,
	getBrowserAPI,
} from './utils';
import { compose } from 'redux';
import { LocalStorage } from '../chromeStorage/BrowserStorage';

export function createPersistentStoreType2(reducer, preloadedState, enhancer) {
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

		return enhancer(createPersistentStoreType2)(reducer, preloadedState);
	}

	let currentReducer = reducer;
	let currentState = preloadedState;
	let currentListeners = new Map();
	let nextListeners = currentListeners;
	let listenerIdCounter = 0;
	let isDispatching = false;

	function ensureCanMutateNextListeners() {
		if (nextListeners === currentListeners) {
			nextListeners = new Map();
			currentListeners.forEach((listener, key) => {
				nextListeners.set(key, listener);
			});
		}
	}

	function getState() {
		if (isDispatching) {
			throw new Error(
				'You may not call store.getState() while the reducer is executing. ' +
					'The reducer has already received the state as an argument. ' +
					'Pass it down from the top reducer instead of reading it from the store.'
			);
		}

		return currentState;
	}

	function subscribe(listener) {
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

	function dispatch(action) {
		if (!isPlainObject(action)) {
			throw new Error(
				`Actions must be plain objects. Instead, the actual type was: '${kindOf(
					action
				)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
			);
		}

		if (typeof action.type === 'undefined') {
			throw new Error(
				'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.'
			);
		}

		if (typeof action.type !== 'string') {
			throw new Error(
				`Action "type" property must be a string. Instead, the actual type was: '${kindOf(
					action.type
				)}'. Value was: '${action.type}' (stringified)`
			);
		}

		if (isDispatching) {
			throw new Error('Reducers may not dispatch actions.');
		}

		try {
			isDispatching = true;
			currentState = currentReducer(currentState, action);
		} finally {
			isDispatching = false;
		}

		const listeners = (currentListeners = nextListeners);
		listeners.forEach((listener) => {
			listener();
		});
		return action;
	}

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

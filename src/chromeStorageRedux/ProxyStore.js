import { LocalStorage } from '../chromeStorage/BrowserStorage';
import { COMMUNICATION_MESSAGE_IDS, CHROME_STORAGE_KEY_FOR } from './constants';
import { getBrowserAPI, getContextType, isPlainObject } from './utils';
// import browser from 'webextension-polyfill';

function CreateProxyStore(context) {
	let browserApi;
	let executionContext = '';
	let subscriptionListeners = [];
	// members for store ready method
	let proxyStoreReadyPromise;
	let proxyStoreReadyStatePromiseResolver;
	let isProxyStoreReady = false;
	let localState = {};
	// Strategy 2.0 - For state updates & subscription broadcast retrieval from background store

	function initialize(context) {
		if (!context) {
			throw new Error(
				`context {String} argument  is required. context should be "popup","options","content-script"`
			);
		}
		executionContext = context;
		browserApi = getBrowserAPI();

		proxyStoreReadyPromise = new Promise((resolve) => {
			proxyStoreReadyStatePromiseResolver = resolve;
		});

		console.log(
			`proxyStore.js - Initializing Proxy Store for ${context} context`
		);

		browserApi.runtime.onMessage.addListener(
			backgroundStoreRuntimeMessageListener
		);

		checkBackgroundStoreExistence();
	}

	// From anypart
	async function dispatch(action) {
		checkStoreReadiness('dispatch');

		if (!isPlainObject(action)) {
			throw new Error(`DispatchAction object should be plain object`);
		}

		if (typeof action.type !== 'string') {
			throw new Error(`Dispatch Action type should be string`);
		}

		console.log(
			`\n\n####> dispatch() - Dispatching action from Proxy Store. Action Payload Text : 	${action?.payload?.text}`
		);
		return new Promise((resolve) => {
			browserApi.runtime.sendMessage(
				{
					type: COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE,
					action: action,
					context: executionContext,
				},
				async (response) => {
					// console.log(`dispatch() - response`, response);
					const lastError = browserApi.runtime.lastError;
					const responseError = response.error;

					if (!lastError && !responseError) {
						await setLocalStateUsingChromeStorage('DISPATCH_SUCCESSFUL');
						resolve(response);
						subscriptionListeners.forEach((l) => l());
					} else {
						throw new Error(responseError ? responseError : lastError);
					}
				}
			);
		});
	}

	function getState() {
		checkStoreReadiness('getState');
		// const strategy2state = proxyStateStrategy2;
		// const latestStateFromStorage =
		// 	await getStateDirectlyFromChromeStorage();

		// console.log(`getState() : Latest State is`, latestStateFromStorage);

		// compareStatesFromBothStrategies(
		// 	latestStateFromStorage,
		// 	strategy2state
		// );
		return localState;
	}

	function subscribe(listener) {
		// Checkstorereadiness should not be part of subscribe
		// Subscriptions to store can added before the store is ready as well
		// checkStoreReadiness('subscribe');

		if (typeof listener !== 'function') {
			throw new Error(`Subscribe function requires a function as an argument`);
		}

		subscriptionListeners.push(listener);

		console.log(
			`Inside subscribe function - Added new Store Listener`,
			subscriptionListeners
		);
		return function unsubscribe() {
			subscriptionListeners = subscriptionListeners.filter(
				(l) => l !== listener
			);
		};
	}

	async function ready(cb) {
		if (cb !== null) {
			return proxyStoreReadyPromise.then(cb);
		}

		return proxyStoreReadyPromise;
	}

	async function checkBackgroundStoreExistence() {
		browserApi.runtime.sendMessage(
			{
				type: COMMUNICATION_MESSAGE_IDS.CHECK_STORE_EXISTENCE,
			},
			async (response) => {
				const lastError = browserApi.runtime.lastError;
				console.log(`checkBackgroundStoreExistence() - response`, response);

				if (response === COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_AVAILABLE) {
					if (!isProxyStoreReady) {
						await setLocalStateUsingChromeStorage('BACKGROUND_STORE_AVAILABLE');
						onBackgroundStoreReadyHandler();
					}
				}

				if (lastError) {
					console.error(
						`Some error occured in checking background store existence : `,
						lastError
					);
					// throw new Error('Some error occured in checking background store');
				}
			}
		);
	}

	async function backgroundStoreRuntimeMessageListener(
		message,
		sender,
		sendResponse
	) {
		// console.log(`backgroundStoreRuntimeMessageListener() - message`, message);
		const { type, responseData } = message;
		switch (type) {
			case COMMUNICATION_MESSAGE_IDS.STORE_SUBSCRIPTION_BROADCAST:
				onSubscriptionBroadcastReceivedHandler(responseData);
				sendResponse(`STORE BROADCAST RECEIVED AT : ${executionContext}`);
				break;
		}
	}

	async function onSubscriptionBroadcastReceivedHandler(responseData) {
		const { action, context } = responseData;
		const isExecutionContextDifferentFromDispatchingContext =
			context !== executionContext;
		let actionDescription = action?.payload?.text;
		actionDescription = actionDescription ? actionDescription : action?.type;

		console.log(
			`onSubscriptionBroadcastReceivedHandler() - Subscription broadcast received`,
			`\nDISPATCHING CONTEXT : ${context}  |     EXECUTION/RECEIVING CONTEXT : ${executionContext}`,
			`\nAction : ${actionDescription}`
		);

		// for dispatch({ type: ActionTypes.INIT }); case
		// background store late initialization
		if (!isProxyStoreReady) {
			isProxyStoreReady = true;
			proxyStoreReadyStatePromiseResolver();
		}

		// only if different context from which dispatch was called
		if (isExecutionContextDifferentFromDispatchingContext) {
			await setLocalStateUsingChromeStorage('STORE_SUBSCRIPTION_BROADCAST');
			subscriptionListeners.forEach((l) => l());
		}
	}

	async function getStateDirectlyFromChromeStorage() {
		const currentState = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR.REDUX_STORE
		);

		if (!currentState) {
			throw new Error(`Proxy state is undefined or null..`);
		}

		return currentState;
	}

	async function setLocalStateUsingChromeStorage(callingScenario) {
		const currentState = await getStateDirectlyFromChromeStorage();
		console.log(
			`Inside setLocalStateUsingChromeStorage : Setting local state to : `,
			currentState,
			`\nCalling Scenario : `,
			callingScenario
		);
		localState = currentState;
	}

	function onBackgroundStoreReadyHandler() {
		console.log(
			`onBackgroundStoreReadyHandler() - Background store is ready now`
		);
		if (!isProxyStoreReady) {
			isProxyStoreReady = true;
			proxyStoreReadyStatePromiseResolver();
		}
		// console.log(`Running subscription listeners now...`);
		// after background store is ready run subscribers
		subscriptionListeners.forEach((l) => l());
	}

	function checkStoreReadiness(caller) {
		if (!isProxyStoreReady) {
			console.log(
				`checkStoreReadiness() : Proxy Store Ready Status : ${isProxyStoreReady}`
			);

			console.error(
				`checkStoreReadiness() : ${caller}() method cannot be called as Proxy store is not yet ready.`
			);

			throw new Error(`
			REASONS FOR PROXY STORE NOT YET READY : 
				1. Most Likely Reason : Using Proxy Store methods outside ProxyStore.Ready() method
				2. Other Reason : Background Store failed to intialize successfully
			`);
		}
	}

	initialize(context);

	return {
		dispatch,
		getState,
		subscribe,
		ready,
	};
}

let proxyStore;
export default function getProxyStore() {
	if (!proxyStore) {
		const appContext = getContextType();
		proxyStore = CreateProxyStore(appContext);
	}

	return proxyStore;
}

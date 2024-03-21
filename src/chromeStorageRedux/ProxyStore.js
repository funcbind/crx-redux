import { LocalStorage } from '../chromeStorage/BrowserStorage';
import {
	COMMUNICATION_MESSAGE_IDS,
	CHROME_STORAGE_KEY_FOR,
	CHROME_REDUX_CONSTANTS,
} from './constants';
import { getBrowserAPI, getContextType, isPlainObject } from './utils';
// import browser from 'webextension-polyfill';

class ProxyStore {
	#browserApi;
	#executionContext;
	#subsriptionListeners = [];
	#browserRuntimeConnectPort;
	// members for store ready method
	proxyStoreReadyPromise;
	#proxyStoreReadyResolver;
	#isProxyStoreReady = false;
	// Strategy 2.0 - For state updates & subscription broadcast retrieval from background store

	constructor(context) {
		if (!context) {
			throw new Error(
				`context {String} argument  is required. context should be "popup","options","content-script"`
			);
		}
		this.#executionContext = context;
		this.#browserApi = getBrowserAPI();

		this.proxyStoreReadyPromise = new Promise((resolve) => {
			this.#proxyStoreReadyResolver = resolve;
		});

		// Direct messaging ( one time request/messaging ) for listening to ready state
		// Store Readiness for content scripts
		// if (this.#browserApi.runtime.onMessage) {
		// 	this.#browserApi.runtime.onMessage.addListener(() =>
		// 		this.#safetyHandler()
		// 	);
		// }
		// this.#connectWithBackendRealStore(context);
		console.log(
			`proxyStore.js - Initializing Proxy Store for ${context} context`
		);

		this.#browserApi.runtime.onMessage.addListener(
			this.#backgroundStoreRuntimeMessageListener.bind(this)
		);

		// Making port connection to background store to receive background store
		// ready status
		// this.#browserRuntimeConnectPort = browser.runtime.connect(null, {
		// 	name: `${CHROME_REDUX_CONSTANTS.BACKGROUND_STORE_CONNECTION_PORT_NAME}-${context}`,
		// });

		this.#checkBackgroundStoreExistence();

		// this.#browserRuntimeConnectPort.onMessage.addListener(
		// 	this.#backgroundStoreMessagesListenerViaPort.bind(this)
		// );
	}

	// From anypart
	async dispatch(action) {
		this.#checkStoreReadiness('dispatch');

		if (!isPlainObject(action)) {
			throw new Error(`DispatchAction object should be plain object`);
		}

		if (typeof action.type !== 'string') {
			throw new Error(`Dispatch Action type should be string`);
		}

		// const response = await this.#browserRuntimeConnectPort.postMessage({
		// 	type: COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE,
		// 	action: action,
		// });

		return new Promise((resolve) => {
			this.#browserApi.runtime.sendMessage(
				{
					type: COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE,
					action: action,
				},
				(response) => {
					console.log(`dispatch() - response`, response);
					const lastError = this.#browserApi.runtime.lastError;
					const responseError = response.error;

					if (!lastError && !responseError) {
						resolve(response);
					} else {
						throw new Error(responseError ? responseError : lastError);
					}
				}
			);
		});
	}

	async getState() {
		this.#checkStoreReadiness('getState');
		// const strategy2state = this.#proxyStateStrategy2;
		const latestStateFromStorage =
			await this.#getStateDirectlyFromChromeStorage();

		// console.log(`getState() : Latest State is`, latestStateFromStorage);

		// this.#compareStatesFromBothStrategies(
		// 	latestStateFromStorage,
		// 	strategy2state
		// );
		return latestStateFromStorage;
	}

	subscribe(listener) {
		this.#checkStoreReadiness('subscribe');
		if (typeof listener !== 'function') {
			throw new Error(`Subscribe function requires a function as an argument`);
		}

		this.#subsriptionListeners.push(listener);

		return function unsubscribe() {
			this.#subsriptionListeners = this.#subsriptionListeners.filter(
				(l) => l !== listener
			);
		};
	}

	async ready(cb) {
		if (cb !== null) {
			return this.proxyStoreReadyPromise.then(cb);
		}

		return this.proxyStoreReadyPromise;
	}

	async #checkBackgroundStoreExistence() {
		this.#browserApi.runtime.sendMessage(
			{
				type: COMMUNICATION_MESSAGE_IDS.CHECK_STORE_EXISTENCE,
			},
			(response) => {
				const lastError = this.#browserApi.runtime.lastError;
				console.log(`checkBackgroundStoreExistence() - response`, response);

				if (response === COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_AVAILABLE) {
					this.#onBackgroundStoreReadyHandler();
				}

				if (lastError) {
					throw new Error(
						`Some error occured in checking background store existence. Error Message : ${lastError}`
					);
				}
			}
		);
	}

	#backgroundStoreRuntimeMessageListener(message, sender, sendResponse) {
		console.log(`backgroundStoreRuntimeMessageListener() - message`, message);
		switch (message.type) {
			case COMMUNICATION_MESSAGE_IDS.STORE_SUBSCRIPTION_BROADCAST:
				console.log(
					`backgroundStoreRuntimeMessageListener() - Subscription broadcast received`
				);

				this.#subsriptionListeners.forEach((l) => l());
				sendResponse(`STORE BROADCAST RECEIVED AT : ${this.#executionContext}`);
				break;
		}
	}

	// Strategy 1.0 - Directly getting latest state from chrome storage
	// instead of message passing from background store
	async #getStateDirectlyFromChromeStorage() {
		const currentState = await LocalStorage.get(
			CHROME_STORAGE_KEY_FOR.REDUX_STORE
		);

		if (!currentState) {
			throw new `Proxy state is undefined or null..`();
		}

		return currentState;
	}

	#backgroundStoreMessagesListenerViaPort(message) {
		console.log(
			`backgroundStorePortMessageHandler() - Inside port connection message handler`,
			message
		);

		switch (message.type) {
			case COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_READY:
				this.#onBackgroundStoreReadyHandler();
				break;
		}
	}

	#onBackgroundStoreReadyHandler() {
		console.log(
			`onBackgroundStoreReadyHandler() - Background store is ready now`
		);
		if (!this.#isProxyStoreReady) {
			this.#isProxyStoreReady = true;
			this.#proxyStoreReadyResolver();
		}
		// after background store is ready run subscribers
		this.#subsriptionListeners.forEach((l) => l());
	}

	#checkStoreReadiness(caller) {
		if (!this.#isProxyStoreReady) {
			console.log(
				`checkStoreReadiness() : Proxy Store Ready State : ${
					this.#isProxyStoreReady
				}`,
				`\nCaller function : ${caller}()`
			);

			if (caller === 'getState') {
				console.error(`getState() - Cannot get latest state`);
			} else if (caller === 'dispatch') {
				console.error(`dispatch() - Cannot dispatch latest action`);
			} else if (caller === 'subscribe') {
				console.error('subscribe() - Cannot subsribe to state changes');
			}

			throw new Error(`
			Proxy Store is not ready - Most possible reasons 
				1. Proxy Store is used before & outside ready method of the store
				2. Background Store using createPersistentStore is not yet created or 
				not successfully created i.e resulted in some error
			Solution : Background store needs to be created first using createPersistentStore before using proxy store`);
		}
	}

	// Direct messaging ( one time request/messaging ) for listening to ready state
	// Store readiness for content scripts
	#safetyHandler(message) {
		if (
			message.type === COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_READY &&
			message.portName ===
				CHROME_REDUX_CONSTANTS.BACKGROUND_STORE_CONNECTION_PORT_NAME
		) {
			console.log(`safetyHandler() - Inside safety handler`, this);
			// Remove Saftey Listener
			this.#browserApi.runtime.onMessage.removeListener(this.#safetyHandler);

			// Resolve if readyPromise has not been resolved.
			if (!this.#isProxyStoreReady) {
				this.#isProxyStoreReady = true;
				this.#proxyStoreReadyResolver();
			}
		}
	}
}

let proxyStore;
export default function getProxyStore() {
	if (!proxyStore) {
		const appContext = getContextType();
		proxyStore = new ProxyStore(appContext);
	}

	return proxyStore;
}

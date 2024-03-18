import { LocalStorage } from '../chromeStorage/storageLib';
import {
	COMMUNICATION_MESSAGE_IDS,
	EXTENSIONS_CONTEXTS,
	CHROME_STORAGE_KEY_FOR,
	CHROME_REDUX_CONSTANTS,
} from './contants';
import { getBrowserAPI, isPlainObject, shallowDiff } from './utils';
import deepEql from 'deep-eql';

const defaultOpts = {
	patchStrategy: shallowDiff,
};

export default class ProxyStore {
	#executionContext;
	#subsriptionListeners = [];
	#browserAPI;
	#browserRuntimeConnectPort;
	#browserRuntimeSendMessage;
	#browserRuntimeOnMessage;
	// members for store ready method
	proxyStoreReadyPromise;
	#proxyStoreReadyResolver;
	#isProxyStoreReady = false;
	// Strategy 2.0 - For state updates & subscription broadcast retrieval from background store
	#patchStrategy;
	#proxyState = {}; // 2nd implementation case for getState

	constructor(
		context,
		sendMessage,
		onMessage,
		options = {
			patchStrategy: defaultOpts.patchStrategy,
		}
	) {
		if (!context) {
			throw new Error(
				`context {String} argument  is required. context should be "popup","options","content-script"`
			);
		}

		if (typeof sendMessage !== 'function') {
			throw new Error(`sendMessage {Function} argument  is required`);
		}

		if (typeof onMessage !== 'function') {
			throw new Error(`onMessage {Function} argument  is required`);
		}

		this.#executionContext = context;

		this.#browserAPI = getBrowserAPI();
		this.#browserRuntimeSendMessage = this.#browserAPI.runtime.sendMessage;
		this.#browserRuntimeOnMessage = this.#browserAPI.runtime.onMessage;
		this.#patchStrategy = options.patchStrategy;

		this.proxyStoreReadyPromise = new Promise((resolve) => {
			this.#proxyStoreReadyResolver = resolve;
		});

		// Direct messaging ( one time request/messaging ) for listening to ready state
		// Store Readiness for content scripts
		if (this.#browserRuntimeOnMessage) {
			this.#browserRuntimeOnMessage(() => this.#safetyHandler());
		}
		// this.#connectWithBackendRealStore(context);
		console.log(
			`proxyStore.js - Initializing Proxy Store for ${context} context`
		);

		this.#listenToBackgroundStoreSubscriptionBroadcast();
		// Making connection with background store ( Long lived connection ) for getting
		// Latest state updates whenever background store subsribe runs
		// State updates happen via state diffs patching
		// If no diff -> no state updates
		this.#browserRuntimeConnectPort = this.#browserAPI.runtime.connect(null, {
			name: `${CHROME_REDUX_CONSTANTS.BACKGROUND_STORE_CONNECTION_PORT_NAME}-${context}`,
		});

		// 2nd Implementation for getState
		// Getting state differences from backend store using port communication
		// and patching them here with local proxy state
		this.#browserRuntimeConnectPort.onMessage.addListener(
			this.#backgroundStorePortMessageHandler.bind(this)
		);
	}

	// From anypart
	async dispatch(action) {
		this.#checkStoreReadiness('dispatch');

		// Earlier implementation using webext-bridge
		// const response = await this.#browserRuntimeSendMessage(
		// 	COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE,
		// 	action,
		// 	EXTENSIONS_CONTEXTS.BACKGROUND
		// );

		if (!isPlainObject(action)) {
			throw new Error(`DispatchAction object should be plain object`);
		}

		if (typeof action.type !== 'string') {
			throw new Error(`Dispatch Action type should be string`);
		}

		if (action.payload && !isPlainObject(action.payload)) {
			throw new Error(`Dispatch Action payload should be plain object`);
		}

		const response = await this.#browserRuntimeConnectPort.postMessage({
			type: COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE,
			action: action,
		});

		if (response.error) {
			console.error(response.error);
			throw new Error(
				`Some error while dispatching action to main store in the background from ${
					this.#executionContext
				}`
			);
		}
		return response;
	}

	async getState() {
		this.#checkStoreReadiness('getState');
		const strategy2state = this.#proxyState;
		const latestStateFromStorage =
			await this.#getStateDirectlyFromChromeStorage();

		console.log(
			`Strategy 1.0 State : `,
			latestStateFromStorage,
			`Strategy 2.0 State : `,
			strategy2state
		);

		this.#compareStatesFromBothStrategies(
			latestStateFromStorage,
			strategy2state
		);
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

	#listenToBackgroundStoreSubscriptionBroadcast() {
		this.#browserRuntimeOnMessage((message) => {
			if (
				message.type ===
				COMMUNICATION_MESSAGE_IDS.BACKGROUND_SUBSCRIPTION_BROADCAST
			) {
				console.log(
					`listenToBackgroundStoreSubscriptionBroadcast() - background store subscription broadcast received successfully`
				);
				console.log(
					`Inside background store subscription broadcast listener`,
					this
				);
				this.#subsriptionListeners.forEach((l) => l());
			}
		});
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

	#backgroundStorePortMessageHandler(message) {
		console.log(
			`backgroundStorePortMessageHandler() - Inside port connection message handler`,
			message,
			arguments
		);
		if (message.type === COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_READY) {
			console.log(
				`backgroundStorePortMessageHandler() - Background store is ready now`
			);
			if (!this.#isProxyStoreReady) {
				this.#isProxyStoreReady = true;
				this.#proxyStoreReadyResolver();
			}
			// after background store is ready run subscribers
			this.#subsriptionListeners.forEach((l) => l());
		} else {
			this.#handleLatestStateUpdates(message);
		}
	}

	// STRATEGY 2.0 - For state updates & subscription handling from background store
	#handleLatestStateUpdates(message) {
		console.info(
			`handleLatestStateUpdates() - handling latest state updates recieved from background store on port connection 
			for initial state & on every subscribe for subsequent state updates\n`,
			`message : `,
			message
		);

		switch (message.type) {
			case COMMUNICATION_MESSAGE_IDS.STATE_TYPE: {
				const initialState = message.payload;
				this.#proxyState = initialState;

				console.log(
					`handleLatestStateUpdates() - Initial state received post successful port connection: `,
					initialState,
					this.#proxyState
				);
				// Most important - Uncomment below code if we decide on actually using Strategy 2.0

				// if (!this.#isProxyStoreReady) {
				// 	this.#isProxyStoreReady = true;
				// 	this.#proxyStoreReadyResolver();
				// }
				// this.#subsriptionListeners.forEach((l) => l());
				break;
			}

			case COMMUNICATION_MESSAGE_IDS.PATCH_STATE_TYPE: {
				const stateDifferences = message.payload;
				this.#proxyState = this.#patchStrategy(this.state, stateDifferences);
				console.log(
					`handleLatestStateUpdates() - Patch state received background store subsciption update retrieval: `,
					stateDifferences,
					this.#proxyState
				);
				// For now we are using patch state only as a comparison method to actual getState
				// this.#subsriptionListeners.forEach((l) => l());
				break;
			}
		}
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

			throw new Error(`Proxy Store is not ready
				- Most possible reason - Background Store using createPersistentStore is not yet created or 
				not successfully created i.e resulted in some error
				- Solution : Background store needs to be created first using createPersistentStore before using proxy store``
			`);
		}
	}

	#compareStatesFromBothStrategies(strategy1State, strategy2State) {
		const areBothStrategiesStatesSame = deepEql(strategy1State, strategy2State);

		if (!areBothStrategiesStatesSame) {
			console.error(
				`Both strategies states are not same. This is not expected.`
			);
		}
	}

	// Direct messaging ( one time request/messaging ) for listening to ready state
	// Store readiness for content scripts
	#safetyHandler(message) {
		console.log(`safetyHandler() - Inside safety handler`, this);
		if (
			message.type === COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_READY &&
			message.portName ===
				CHROME_REDUX_CONSTANTS.BACKGROUND_STORE_CONNECTION_PORT_NAME
		) {
			// Remove Saftey Listener
			this.#browserRuntimeOnMessage.removeListener(this.#safetyHandler);

			// Resolve if readyPromise has not been resolved.
			if (!this.#isProxyStoreReady) {
				this.#isProxyStoreReady = true;
				this.#proxyStoreReadyResolver();
			}
		}
	}

	/* 
		Deprecated functions
	*/

	// async #connectWithBackendRealStore(context) {
	// 	const response = await this.#sendMessage(
	// 		COMMUNICATION_MESSAGE_IDS.CHECK_STORE_EXISTENCE,
	// 		{},
	// 		EXTENSIONS_CONTEXTS.BACKGROUND
	// 	);

	// 	console.log(`Background store exists, Proxy store is now ready`, response);

	// 	this.#proxyStoreReadyResolver();
	// 	this.#isProxyStoreReady = true;

	// 	this.#onMessage(
	// 		COMMUNICATION_MESSAGE_IDS.SUBSCRIBE_TO_STORE_CHANGES,
	// 		(messageObj) => {
	// 			const { data } = messageObj;
	// 			const { action, latestState } = data;
	// 			// console.log(
	// 			// 	`proxyStore.js : Inside subscription listener`,
	// 			// 	action,
	// 			// 	latestState
	// 			// );
	// 			if (this.#subsriptionListeners.length > 0) {
	// 				this.#subsriptionListeners.forEach((listener) =>
	// 					listener(action, latestState)
	// 				);
	// 			}
	// 		}
	// 	);
	// }

	async #getStateFromBackgroundStoreViaMessaging() {
		const response = await this.#browserRuntimeSendMessage(
			COMMUNICATION_MESSAGE_IDS.GET_LATEST_STORE_STATE,
			{},
			EXTENSIONS_CONTEXTS.BACKGROUND
		);
		if (response.error) {
			console.error(`Some error occurred while get state from main store in the background from
			${this.#executionContext}`);
			console.error(`Possible root cause - Calling getState after calling dispatch function without await
				Possible Solution : Add await before calling dispatch if we need to immediately call getState after that
			`);
			throw new Error(response.error);
		}
		const { data } = response;
		return data;
	}
}

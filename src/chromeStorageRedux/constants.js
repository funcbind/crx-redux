const CHROME_STORAGE_KEY_FOR = {
	REDUX_STORE: '___REDUX_STORE___',
	IS_REDUX_STORE_INITIALIZED: '___IS_REDUX_STORE_INITIALIZED___',
	ACTIVE_EXTENSION_CONTEXTS: '___ACTIVE_EXTENSION_CONTEXTS___',
};

const EXTENSIONS_CONTEXTS = {
	CONTENT_SCRIPT: 'content-script',
	POPUP: 'popup',
	OPTIONS: 'options',
	BACKGROUND: 'background',
	DEVTOOLS: 'devtools',
	OFFSCREEN: 'offscreen',
};

const COMMUNICATION_MESSAGE_IDS = {
	DISPATCH_TO_STORE: 'crx.dispatch',
	GET_LATEST_STORE_STATE: 'crx.get_state',
	SUBSCRIBE_TO_STORE_CHANGES: 'crx.subscribe',
	CHECK_STORE_EXISTENCE: 'crx.check_store_existence',
	BACKGROUND_STORE_AVAILABLE: 'crx.store_available',
	PATCH_STATE_TYPE: 'crx.patch_state',
	STATE_TYPE: 'crx.state',
	BACKGROUND_STORE_READY: 'crx.background_store_ready',
	STORE_SUBSCRIPTION_BROADCAST: 'crx.background_subscription_broadcast',
	STORE_UPDATE_BROADCAST: 'crx.store_update_broadcast',
};

Object.freeze(CHROME_STORAGE_KEY_FOR);
Object.freeze(EXTENSIONS_CONTEXTS);
Object.freeze(COMMUNICATION_MESSAGE_IDS);

export {
	CHROME_STORAGE_KEY_FOR,
	EXTENSIONS_CONTEXTS,
	COMMUNICATION_MESSAGE_IDS,
};

import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './Popup.jsx';
import '../index.css';
import { addCopiedItem } from '../common/clipboardItemsReducer.js';
import { sendMessage, onMessage } from 'webext-bridge/popup';
import ProxyStore from '../chromeStorageRedux/proxyStore.js';
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/contants.js';

console.log(`This is the Popup file!!!`);

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Popup />
	</React.StrictMode>
);

async function subscribeToPersistentStoreChanges() {
	const PopupProxyStore = new ProxyStore(
		EXTENSIONS_CONTEXTS.POPUP,
		sendMessage,
		onMessage
	);
	console.log(`main.jsx - Inside popup context - testing proxy store`);
	// PopupProxyStore.ready(async () => {
	// 	console.log(`Popup main.jsx - Proxy store is ready to rock n roll`);
	// });

	// await PopupProxyStore.subscribe(async () => {
	// 	console.log(
	// 		`Inside Popup main.jsx - Background store Subscription listener`
	// 	);
	// 	const newState = await PopupProxyStore.getState();
	// 	console.log(`Latest state post subscription listener calling : `, newState);
	// });

	// let latestState = await PopupProxyStore.getState();
	// console.log(`Latest state is : `, latestState);
}

setTimeout(() => {
	subscribeToPersistentStoreChanges();
}, 10000);

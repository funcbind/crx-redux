import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options.jsx';
import '../index.css';
import { addCopiedItem } from '../common/clipboardItemsReducer.js';
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/contants.js';
import { sendMessage, onMessage } from 'webext-bridge/options';
import ProxyStore from '../chromeStorageRedux/proxyStore.js';

console.log(`This is the Options file!!!`);

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Options />
	</React.StrictMode>
);

async function subscribeToPersistentStoreChanges() {
	const OptionsProxyStore = new ProxyStore(
		EXTENSIONS_CONTEXTS.OPTIONS,
		sendMessage,
		onMessage
	);

	OptionsProxyStore.ready(async () => {
		console.log(`Options Proxy Store is now ready`);
		const initialState = await OptionsProxyStore.getState();
		console.log(`Initial State is :`, initialState);
	});
	// await OptionsProxyStore.subscribe(async () => {
	// 	console.log(
	// 		`Inside Options main.jsx - Background store Subscription listener`
	// 	);
	// 	const newState = await OptionsProxyStore.getState();
	// 	console.log(`Latest state post subscription listener calling : `, newState);
	// });
	// await OptionsProxyStore.dispatch(addCopiedItem(`Txt123 text321 HelloWorld`));
	// await OptionsProxyStore.dispatch(addCopiedItem(`Testing store subscription`));
	// OptionsProxyStore.dispatch(
	// 	addCopiedItem(`Main store access testing from content script`)
	// );
	// await OptionsProxyStore.dispatch(
	// 	addCopiedItem(`content script store access testing`)
	// );
	// OptionsProxyStore.dispatch(addCopiedItem(`awaited testing`));
	// OptionsProxyStore.dispatch(
	// 	addCopiedItem(`next testing is without await or promise.all`)
	// );
	// let latestState = await OptionsProxyStore.getState();
	// console.log(`Latest state is : `, latestState);
}

setTimeout(() => {
	subscribeToPersistentStoreChanges();
}, 6000);

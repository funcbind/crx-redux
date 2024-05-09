import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import Popup from './Popup.jsx';
import '../index.css';
import getProxyStore from '../chromeStorageRedux/ProxyStore.js';
import {
	addCopiedItem,
	clearClipboard,
} from '../common/clipboardItemsReducer.js';

console.log(`This is the Popup file!!!`);

const proxyStore = getProxyStore();

proxyStore.subscribe(() => {
	const latestState = proxyStore.getState();
	console.log(
		`Inside First ProxyStore.subscribe() - Latest state : `,
		latestState
	);
});

proxyStore.subscribe(() => {
	const latestState = proxyStore.getState();
	console.log(
		`Inside Second ProxyStore.subscribe() - Latest state : `,
		latestState
	);
});

function testingWithReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITH" React`
	);
	proxyStore.ready(async () => {
		console.log(
			`testingWithoutReact() - Popup Context : Proxy Store is now ready`
		);
		ReactDOM.createRoot(document.getElementById('root')).render(
			<React.StrictMode>
				<Provider store={proxyStore}>
					<Popup />
				</Provider>
			</React.StrictMode>
		);
	});
}

async function testingWithoutReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITHOUT" React`
	);

	proxyStore.ready(async () => {
		console.log(
			`testingWithoutReact() - Popup Context : Proxy Store is now ready`
		);
		// await proxyStore.dispatch(clearClipboard());
		const latestState1 = proxyStore.getState();
		console.log(`Latest state 1 : `, latestState1);

		// await proxyStore.dispatch(addCopiedItem('Copied Text 1'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 2'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 3'));
		// await proxyStore.dispatch(addCopiedItem('Copied Text 4'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 5'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 6'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 7'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 8'));
		// await proxyStore.dispatch(addCopiedItem('Copied Text 7'));

		// const latestState3 = proxyStore.getState();
		// console.log(`testingWithoutReact() - Latest State 3 : `, latestState3);
	});
}

setTimeout(() => {
	testingWithReact();
	// testingWithoutReact();
}, 2000);

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import Popup from './Popup.jsx';
import '../index.css';
import getProxyStore from '../chromeStorageRedux/ProxyStore.js';
import { addCopiedItem } from '../common/clipboardItemsReducer.js';

console.log(`This is the Popup file!!!`);

const proxyStore = getProxyStore();

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

		proxyStore.subscribe(() => {
			const latestState = proxyStore.getState();
			console.log(
				`Inside ProxyStore.subscribe() - Latest state : `,
				latestState
			);
		});

		const latestState = proxyStore.getState();
		console.log(`testingWithoutReact() - Latest State : `, latestState);
		await proxyStore.dispatch(addCopiedItem('Copied Text 1'));
		await proxyStore.dispatch(addCopiedItem('Copied Text 2'));
		await proxyStore.dispatch(addCopiedItem('Copied Text 3'));
		const latestStatePostDispatch = proxyStore.getState();
		console.log(
			`testingWithoutReact() - Latest State : `,
			latestStatePostDispatch
		);
	});
}

setTimeout(() => {
	// testingWithReact();
	testingWithoutReact();
}, 3000);

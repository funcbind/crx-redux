import '../common/rollbarConfig.js';
import '../common/rollbar.min.js';
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
import getReduxPersistenceStore from '../background/store.js';

console.log(`This is the Popup file!!!`);

const reduxPersistenceStore = await getReduxPersistenceStore();
console.log(`Redux Store : `, reduxPersistenceStore);

reduxPersistenceStore.subscribe(() => {
	const latestState = reduxPersistenceStore.getState();
	const clipboardItems = latestState?.clipboardItems;
	console.log(
		`Inside First ProxyStore.subscribe() - Latest state : `,
		latestState,
		clipboardItems
	);
});

async function testingWithoutReact() {
	const firstState = reduxPersistenceStore.getState();
	console.log(`First State before any dispatches : `, firstState);

	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 1'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 2'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 3'));

	// const latestState1 = reduxPersistenceStore.getState();
	// console.log(`testingWithoutReact() - Latest State 3 : `, latestState1);

	// await proxyStore.dispatch(addCopiedItem('Copied Text 4'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 5'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 6'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 7'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 8'));
	// await proxyStore.dispatch(addCopiedItem('Copied Text 7'));
}

function testingWithReact() {
	// throw new Error(`testingWithReact() - Now it won't go....let see`);
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITH" React`
	);

	ReactDOM.createRoot(document.getElementById('root')).render(
		<React.StrictMode>
			<Provider store={reduxPersistenceStore}>
				<Popup />
			</Provider>
		</React.StrictMode>
	);
}

setTimeout(() => {
	testingWithReact();
	// testingWithoutReact();
}, 2000);

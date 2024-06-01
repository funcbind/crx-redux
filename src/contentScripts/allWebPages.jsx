import React from 'react';
import ReactDOM from 'react-dom/client';
import getProxyStore from '../chromeStorageRedux/ProxyStore.js';
import { Provider } from 'react-redux';
import {
	addCopiedItem,
	deleteCopiedItem,
	reverseCopiedItems,
	clearClipboard,
	editCopiedItem,
} from '../common/clipboardItemsReducer.js';
import MainContent from './ContentScriptTestingComponent.jsx';
import getReduxPersistenceStore from '../background/store.js';
// import styles1 from '../index.css?inline';
// import styles2 from '../App.css?inline';

console.log(`inside content script on gitlab.com`);
// window.addEventListener('load', onWindowLoaded, false);
setTimeout(onWindowLoaded, 4000);

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

function onWindowLoaded() {
	console.log(`allwebPages.jsx - window loaded`);
	testingWithReact();
	// testingWithoutReact();
}

async function testingWithoutReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITHOUT" React`
	);

	// await proxyStore.dispatch(clearClipboard());
	const latestState = reduxPersistenceStore.getState();
	console.log(`Latest state before any dispatches : `, latestState);

	// await proxyStore.dispatch(addCopiedItem('Copied Text 1'));
	// const latestState1 = proxyStore.getState();
	// console.log(`testingWithoutReact() - Latest State 1 : `, latestState1);
	// await proxyStore.dispatch(addCopiedItem('Copied Text 2'));
	// const latestState2 = proxyStore.getState();
	// console.log(`testingWithoutReact() - Latest State 2 : `, latestState2);
	// await proxyStore.dispatch(addCopiedItem('Copied Text 3'));
	// const latestState3 = proxyStore.getState();
	// console.log(`testingWithoutReact() - Latest State 3 : `, latestState3);
	// await proxyStore.dispatch(addCopiedItem('Copied Text 4'));
	// const latestState4 = proxyStore.getState();
	// console.log(`testingWithoutReact() - Latest State 4 : `, latestState4);

	// proxyStore.dispatch(addCopiedItem('Copied Text 1'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 2'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 3'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 4'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 5'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 6'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 7'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 8'));

	// const preFinalState = proxyStore.getState();
	// console.log(
	// 	`====> testingWithoutReact() - Pre Final State : `,
	// 	preFinalState
	// );

	// await proxyStore.dispatch(addCopiedItem('Copied Text 1'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 2'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 3'));
	// const latestState1 = proxyStore.getState();
	// console.log(
	// 	`====> testingWithoutReact() - Latest State 1 : `,
	// 	latestState1,
	// 	`\n`
	// );

	// await proxyStore.dispatch(addCopiedItem('Copied Text 4'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 5'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 6'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 7'));
	// const latestState2 = proxyStore.getState();
	// console.log(
	// 	`====> testingWithoutReact() - Latest State 2 : `,
	// 	latestState2,
	// 	`\n`
	// );

	// await proxyStore.dispatch(addCopiedItem('Copied Text 8'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 9'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 10'));
	// const latestState3 = proxyStore.getState();
	// console.log(
	// 	`====> testingWithoutReact() - Latest State 3 : `,
	// 	latestState3,
	// 	`\n`
	// );

	// await proxyStore.dispatch(addCopiedItem('Copied Text 11'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 12'));
	// proxyStore.dispatch(addCopiedItem('Copied Text 13'));
	// const latestState4 = proxyStore.getState();
	// console.log(
	// 	`====> testingWithoutReact() - Latest State 4 : `,
	// 	latestState4,
	// 	`\n`
	// );

	// const finalState = proxyStore.getState();
	// console.log(`====> testingWithoutReact() - Final State : `, finalState);
}

function testingWithReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITH" React`
	);

	const contentRoot = document.createElement('div');
	contentRoot.id = 'nc-root';
	const shadowRoot = contentRoot.attachShadow({ mode: 'open' });
	const shadowWrapper = document.createElement('div');
	shadowWrapper.id = 'root';
	document.body.append(contentRoot);
	shadowRoot.append(shadowWrapper);

	// Attach a shadow root to the host
	console.log(
		`testingWithoutReact() - Content-script Context : Proxy Store is now ready`
	);
	ReactDOM.createRoot(shadowWrapper).render(
		<React.StrictMode>
			<Provider store={reduxPersistenceStore}>
				<style type='text/css'>
					{/* {styles1}
						{styles2} */}
				</style>
				<MainContent />
			</Provider>
		</React.StrictMode>
	);
}

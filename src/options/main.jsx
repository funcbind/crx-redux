import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options.jsx';
import '../index.css';
import getProxyStore from '../chromeStorageRedux/ProxyStore.js';
import { Provider } from 'react-redux';
import { addCopiedItem } from '../common/clipboardItemsReducer.js';

console.log(`This is the Options file!!!`);

const proxyStore = getProxyStore();
setTimeout(() => {
	testingWithReact();
	// testingWithoutReact();
}, 3000);

proxyStore.subscribe((action) => {
	const latestState = proxyStore.getState();
	console.log(
		`Subscription 1 - Latest state : `,
		latestState,
		`  |  Action Type : `,
		action?.type,
		`  |  Action Payload Text : `,
		action?.payload?.text
	);

	// console.log(`Subscription 1 run for action : `,action?.payload?.text );
});

proxyStore.subscribe((action) => {
	const latestState = proxyStore.getState();
	console.log(
		`Subscription 2 - Latest state : `,
		latestState,
		`  |  Action Type : `,
		action?.type,
		`  |  Action Payload Text : `,
		action?.payload?.text
	);
	// console.log(`Subscription 2 run for action : `, action?.payload?.text);
});

// await proxyStore.dispatch(addCopiedItem('Outside ready dispatch testing'));
// const latestState = proxyStore.getState();

// console.log(
// 	`Options.js - Latest state outside ProxyStore.ready()`,
// 	latestState
// );

async function testingWithoutReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITHOUT" React`
	);

	proxyStore.ready(async () => {
		console.log(
			`testingWithoutReact() - Options Context : Proxy Store is now ready`
		);
		// await proxyStore.dispatch(clearClipboard());
		const firstState = proxyStore.getState();
		console.log(`First state : `, firstState);

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

		// const statePostContinuousDispatches = proxyStore.getState();
		// console.log(
		// 	`testingWithoutReact() - Latest State Post continuous dispatches : `,
		// 	statePostContinuousDispatches
		// );

		await proxyStore.dispatch(addCopiedItem('Copied Text 1'));
		proxyStore.dispatch(addCopiedItem('Copied Text 2'));
		proxyStore.dispatch(addCopiedItem('Copied Text 3'));
		const latestState1 = proxyStore.getState();
		console.log(
			`====> testingWithoutReact() - Latest State 1 : `,
			latestState1
		);

		await proxyStore.dispatch(addCopiedItem('Copied Text 4'));
		proxyStore.dispatch(addCopiedItem('Copied Text 5'));
		proxyStore.dispatch(addCopiedItem('Copied Text 6'));
		proxyStore.dispatch(addCopiedItem('Copied Text 7'));
		const latestState2 = proxyStore.getState();
		console.log(
			`====> testingWithoutReact() - Latest State 2 : `,
			latestState2
		);

		// await proxyStore.dispatch(addCopiedItem('Copied Text 8'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 9'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 10'));
		// const latestState3 = proxyStore.getState();
		// console.log(
		// 	`====> testingWithoutReact() - Latest State 3 : `,
		// 	latestState3
		// );

		// await proxyStore.dispatch(addCopiedItem('Copied Text 11'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 12'));
		// proxyStore.dispatch(addCopiedItem('Copied Text 13'));
		// const latestState4 = proxyStore.getState();
		// console.log(
		// 	`====> testingWithoutReact() - Latest State 4 : `,
		// 	latestState4
		// );

		setTimeout(() => {
			const finalState = proxyStore.getState();
			console.log(`====> testingWithoutReact() - Final State : `, finalState);
		}, 1000);
	});
}

function testingWithReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITH" React`
	);
	proxyStore.ready(async () => {
		console.log(
			`testingWithoutReact() - Options Context : Proxy Store is now ready`
		);
		ReactDOM.createRoot(document.getElementById('root')).render(
			<React.StrictMode>
				<Provider store={proxyStore}>
					<Options />
				</Provider>
			</React.StrictMode>
		);
	});
}

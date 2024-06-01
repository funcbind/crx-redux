import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options.jsx';
import '../index.css';
import getProxyStore from '../chromeStorageRedux/ProxyStore.js';
import { Provider } from 'react-redux';
import { addCopiedItem } from '../common/clipboardItemsReducer.js';
import createPersistentReduxStore from '../background/store.js';

console.log(`This is the Options file!!!`);

const reduxPersistenceStore = await createPersistentReduxStore();
console.log(`Redux Store : `, reduxPersistenceStore);

setTimeout(() => {
	testingWithReact();
	// testingWithoutReact();
}, 2000);

reduxPersistenceStore.subscribe(() => {
	const latestState = reduxPersistenceStore.getState();
	const clipboardItems = latestState?.clipboardItems;
	console.log(
		`Inside First ProxyStore.subscribe() - Latest state : `,
		latestState,
		clipboardItems
	);

	// console.log(`Subscription 1 run for action : `,action?.payload?.text );
});

async function testingWithoutReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITHOUT" React`
	);

	const firstState = reduxPersistenceStore.getState();
	console.log(`First state : `, firstState);

	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 1'));
	// const latestState1 = reduxPersistenceStore.getState();
	// console.log(`testingWithoutReact() - Latest State 1 : `, latestState1);
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 2'));
	// const latestState2 = reduxPersistenceStore.getState();
	// console.log(`testingWithoutReact() - Latest State 2 : `, latestState2);
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 3'));
	// const latestState3 = reduxPersistenceStore.getState();
	// console.log(`testingWithoutReact() - Latest State 3 : `, latestState3);
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 4'));
	// const latestState4 = reduxPersistenceStore.getState();
	// console.log(`testingWithoutReact() - Latest State 4 : `, latestState4);

	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 1'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 2'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 3'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 4'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 5'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 6'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 7'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 8'));

	// const statePostContinuousDispatches = reduxPersistenceStore.getState();
	// console.log(
	// 	`testingWithoutReact() - Latest State Post continuous dispatches : `,
	// 	statePostContinuousDispatches
	// );

	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 1'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 2'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 3'));
	// const latestState5 = reduxPersistenceStore.getState();
	// console.log(`====> testingWithoutReact() - Latest State 5 : `, latestState5);

	// await reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 4'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 5'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 6'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 7'));
	// const latestState6 = reduxPersistenceStore.getState();
	// console.log(`====> testingWithoutReact() - Latest State 6 : `, latestState6);

	// await reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 8'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 9'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 10'));
	// const latestState7 = reduxPersistenceStore.getState();
	// console.log(
	// 	`====> testingWithoutReact() - Latest State 7 : `,
	// 	latestState7
	// );

	// await reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 11'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 12'));
	// reduxPersistenceStore.dispatch(addCopiedItem('Copied Text 13'));
	// const latestState8 = reduxPersistenceStore.getState();
	// console.log(
	// 	`====> testingWithoutReact() - Latest State 8 : `,
	// 	latestState8
	// );

	// setTimeout(() => {
	// 	const finalState = reduxPersistenceStore.getState();
	// 	console.log(`====> testingWithoutReact() - Final State : `, finalState);
	// }, 1000);
}

function testingWithReact() {
	console.log(
		`testingWithoutReact() - Testing Redux Chrome Storage "WITH" React`
	);
	console.log(
		`testingWithoutReact() - Options Context : Proxy Store is now ready`
	);
	ReactDOM.createRoot(document.getElementById('root')).render(
		<React.StrictMode>
			<Provider store={reduxPersistenceStore}>
				<Options />
			</Provider>
		</React.StrictMode>
	);
}

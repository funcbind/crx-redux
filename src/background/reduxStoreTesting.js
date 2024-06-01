import createTestStore, { createNormalReduxStore } from './store';
import { addCopiedItem, clearClipboard } from '../common/clipboardItemsReducer';
import logLevel from '../common/appLogger';
import getReduxPersistenceStore from './store';
// import { onMessage } from 'webext-bridge/background';

let unsubscribe;

setTimeout(async () => {
	// Normal Redux store
	const normalReduxStore = createNormalReduxStore();

	normalReduxStore.subscribe(() => {
		logLevel.debug(`Normal Redux Store changed`, normalReduxStore.getState());
	});
	// normalReduxStore.dispatch(addCopiedItem('Normal Redux Store Dispatch 1'));
	// normalReduxStore.dispatch(addCopiedItem('Normal Redux Store Dispatch 2'));

	// peristence Store
	const reduxPersistenceStore = await getReduxPersistenceStore();
	console.log(`Redux Store : `, reduxPersistenceStore);
	unsubscribe = reduxPersistenceStore.subscribe(async () => {
		const latestState = await reduxPersistenceStore.getState();
		const clipboardItems = latestState?.clipboardItems;
		console.log(
			`reduxStoreTesting.js : Background store changed -> Latest state`,
			latestState,
			clipboardItems
		);
	});

	await reduxPersistenceStore.dispatch(clearClipboard());
	// const firstState = await reduxPersistenceStore.getState();
	// console.log(`First state before anything : `, firstState);

	// await reduxPersistenceStore.dispatch(
	// 	addCopiedItem('Middleware Testing Dispatch 1')
	// );
	// await reduxPersistenceStore.dispatch(
	// 	addCopiedItem('Middleware Testing Dispatch 2')
	// );
	// // // store.dispatch(addCopiedItem('Middleware Testing Dispatch 3'));
	// const latestState1 = await reduxPersistenceStore.getState();
	// console.log(`Latest state `, latestState1);

	// // store.dispatch(addCopiedItem('Middleware Testing Dispatch 4'));
	// await reduxPersistenceStore.dispatch(
	// 	addCopiedItem('Middleware Testing Dispatch 5')
	// );
	// const latestState2 = await reduxPersistenceStore.getState();
	// console.log(`Latest state `, latestState2);

	// store.dispatch(addCopiedItem('Middleware Testing Dispatch 6'));
	// const latestState = await store.getState();
	// console.log(`Latest state `, latestState);

	// setTimeout(async () => {
	// 	await store.dispatch(addCopiedItem('Testing Middleware Integration'));
	// 	const latestState = await store.getState();
	// 	console.log(`Latest state : `, latestState);
	// }, 5000);
}, 2000);

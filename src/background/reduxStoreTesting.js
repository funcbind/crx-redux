import createTestStore from './store';
import { addCopiedItem } from '../common/clipboardItemsReducer';
// import { onMessage } from 'webext-bridge/background';

let unsubscribe;

console.log(`Inside reduxStoreTesting.js - Testing persistent store`);

setTimeout(async () => {
	// clearing local storage before testing
	const store = await createTestStore();
	console.log(`Test Store : `, store);
	unsubscribe = store.subscribe(async () => {
		const latestState = await store.getState();
		const { clipboardItems } = latestState;
		console.log(
			`reduxStoreTesting.js : Background store changed -> Latest state`,
			latestState,
			clipboardItems
		);
	});

	// const firstState = await store.getState();
	// console.log(`First state before anything : `, firstState);

	await store.dispatch(addCopiedItem('Middleware Testing Dispatch 1'));
	// await store.dispatch(addCopiedItem('Middleware Testing Dispatch 2'));
	// store.dispatch(addCopiedItem('Middleware Testing Dispatch 3'));
	const latestState1 = await store.getState();
	console.log(`Latest state `, latestState1);

	// store.dispatch(addCopiedItem('Middleware Testing Dispatch 4'));
	// await store.dispatch(addCopiedItem('Middleware Testing Dispatch 5'));
	// const latestState2 = await store.getState();
	// console.log(`Latest state `, latestState2);

	// store.dispatch(addCopiedItem('Middleware Testing Dispatch 6'));
	// const latestState = await store.getState();
	// console.log(`Latest state `, latestState);

	// setTimeout(async () => {
	// 	await store.dispatch(addCopiedItem('Testing Middleware Integration'));
	// 	const latestState = await store.getState();
	// 	console.log(`Latest state : `, latestState);
	// }, 5000);
}, 0);

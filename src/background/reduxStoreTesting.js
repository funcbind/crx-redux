import createTestStore from './store';
import { addCopiedItem } from '../common/clipboardItemsReducer';
// import { onMessage } from 'webext-bridge/background';

let unsubscribe;

console.log(`Inside reduxStoreTesting.js - Testing persistent store`);

setTimeout(async () => {
	// clearing local storage before testing
	const store = await createTestStore();
	console.log(`Test Store : `, store);
	setTimeout(async () => {
		await store.dispatch(addCopiedItem('Testing Middleware Integration'));
		const latestState = await store.getState();
		console.log(`Latest state : `, latestState);
	}, 10000);

	unsubscribe = store.subscribe(async () => {
		const latestState = await store.getState();
		const { clipboardItems } = latestState;
		console.log(
			`reduxStoreTesting.js : Background store changed -> Latest state`,
			latestState,
			clipboardItems
		);
	});
	// try {
	// 	await store.dispatch(addCopiedItem('First dispatch testing'));
	// } catch (error) {
	// 	console.log(`reduxStoreTesting.js : Error while dispatching`, error);
	// }
	// store.dispatch(addCopiedItem('111 Second dispatch Testing'));
	// store.dispatch(addCopiedItem('Fifth dispatch Testing'));
	// const latestState = await store.getState();
	// console.log(`Latest state after four dispatches`, latestState);
}, 3000);

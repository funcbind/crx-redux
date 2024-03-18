import createTestStore from './store';
import { addCopiedItem } from '../common/clipboardItemsReducer';
// import { onMessage } from 'webext-bridge/background';

let unsubscribe;

console.log(`Inside reduxStoreTesting.js - Testing persistent store`);

setTimeout(async () => {
	// clearing local storage before testing
	const store = await createTestStore();
	unsubscribe = store.subscribe(async () => {
		const latestState = await store.getState();
		const { clipboardItems } = latestState;
		console.log(
			`reduxStoreTesting.js : Background store changed -> Latest state`,
			latestState,
			clipboardItems
		);
	});
	await store.dispatch(addCopiedItem('First dispatch testing'));
	await store.dispatch(addCopiedItem('Second dispatch Testing'));
	await store.dispatch(addCopiedItem('Third dispatch Testing'));
	await store.dispatch(addCopiedItem('Fourth dispatch Testing'));
	await store.dispatch(addCopiedItem('Fifth dispatch Testing'));
	// const latestState = await store.getState();
	// console.log(`Latest state after four dispatches`, latestState);
	// store.dispatch(addCopiedItem('This is some copied text'));
}, 3000);

// console.log(`Unsubscribe : `, unsubscribe);
// setTimeout(() => {
// 	unsubscribe();
// }, 15000);

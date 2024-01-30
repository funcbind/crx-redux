import store from './store';
import { addCopiedItem } from '../common/clipboardItemsReducer';

let unsubscribe;

console.log(`Inside reduxStoreTesting.js - Testing persistent store`);

setTimeout(async () => {
	// clearing local storage before testing
	unsubscribe = store.subscribe(async () => {
		const latestState = await store.getState();
		const { clipboardItems } = latestState;
		console.log(
			`reduxStoreTesting.js : Background store changed -> Latest state`,
			latestState,
			JSON.stringify(clipboardItems, null, 2)
		);
	});

	store.dispatch(addCopiedItem('1st copied text!!'));
	store.dispatch(addCopiedItem('Another Copied Text'));
	store.dispatch(addCopiedItem('Copying Copying Copying'));
	store.dispatch(addCopiedItem('Testing123 Testing123'));

	// const latestState = await store.getState();
	// console.log(`Latest state after four dispatches  `, latestState);
	// // store.dispatch(addCopiedItem('This is some copied text'));
}, 8000);

// console.log(`Unsubscribe : `, unsubscribe);
// setTimeout(() => {
// 	unsubscribe();
// }, 15000);

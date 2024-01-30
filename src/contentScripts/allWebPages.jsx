import { Store as ProxyStore } from 'webext-redux';
// import {
// 	// toggleVisibilityOnWebPages,
// 	// toggleFifo,
// 	// setOpacity,
// 	// setTimeToDisappear,
// } from '../common/clipboardSettingsReducer';
import {
	addCopiedItem,
	// deleteCopiedItem,
	// reverseCopiedItems,
	// clearClipboard,
	// editCopiedItem,
	// getCopiedItem,
	getCopiedItems,
} from '../common/clipboardItemsReducer';

window.addEventListener('load', onWindowLoaded, false);

const proxyStore = new ProxyStore();

console.log(`Inside content script : `);
proxyStore.ready().then(async () => {
	// proxyStore.dispatch(toggleVisibilityOnWebPages());
	// proxyStore.dispatch(toggleFifo());
	// proxyStore.dispatch(setOpacity(0.79));
	// proxyStore.dispatch(setTimeToDisappear(560));
	// await fakeAddCopiedItems();
	const clipboardItems = getCopiedItems(proxyStore.getState());
	console.log(`clipboard items : `, clipboardItems);
	const thirdCopiedItemId = clipboardItems?.[2]?.id;
	console.log(`third copied item id : `, thirdCopiedItemId);
	// await proxyStore.dispatch(deleteCopiedItem(thirdCopiedItemId));
	const updatedClipboardItems = getCopiedItems(proxyStore.getState());
	console.log(`clipboard items : `, updatedClipboardItems);
});

function fakeAddCopiedItems() {
	return Promise.all([
		proxyStore.dispatch(addCopiedItem('This is some copied text')),
		proxyStore.dispatch(addCopiedItem('Another copied text')),
		proxyStore.dispatch(addCopiedItem('Testing some copied text')),
		proxyStore.dispatch(addCopiedItem('More copied Text')),
		proxyStore.dispatch(addCopiedItem('multi copy chrome extension'))
	]);
}

// proxyStore.subscribe(() => {
// 	console.log(`proxy store changed : `, proxyStore.getState());
// });

function onWindowLoaded() {
	console.log(`window loaded`);
	// DO YOUR STUFF HERE.
}

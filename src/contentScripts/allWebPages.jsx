import ContentScriptProxyStore from '../chromeStorageRedux/ContentScriptProxyStore';
import './MainContent.jsx';
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/contants.js';
import { sendMessage, onMessage } from 'webext-bridge/content-script';
import ProxyStore from '../chromeStorageRedux/proxyStore.js';

console.log(`inside content script on gitlab.com`);
// window.addEventListener('load', onWindowLoaded, false);

setTimeout(onWindowLoaded, 4000);

function onWindowLoaded() {
	console.log(`allwebPages.jsx - window loaded`);
	setTimeout(testStoreAccess, 5000);
}

async function testStoreAccess() {
	const ContentScriptProxyStore = new ProxyStore(
		EXTENSIONS_CONTEXTS.CONTENT_SCRIPT,
		sendMessage,
		onMessage
	);
	// ContentScriptProxyStore.subscribe(async () => {
	// 	console.log(`Inside content script - Backend Store Subscription listener`);
	// 	const newState = await ContentScriptProxyStore.getState();
	// 	console.log(`Latest state post subscription listener calling : `, newState);
	// });
	// await ContentScriptProxyStore.dispatch(
	// 	addCopiedItem(`Txt123 text321 HelloWorld`)
	// );
	// await ContentScriptProxyStore.dispatch(
	// 	addCopiedItem(`Testing store subscription`)
	// );
	// let latestState = await ContentScriptProxyStore.getState();
	// console.log(`Latest state is : `, latestState);
	// ContentScriptProxyStore.dispatch(
	// 	addCopiedItem(`Main store access testing from content script`)
	// );
	// ContentScriptProxyStore.dispatch(addCopiedItem(`content script store access testing`));
	// latestState = await ContentScriptProxyStore.getState();
	// console.log(`Latest state is : `, latestState);
	// ContentScriptProxyStore.dispatch(addCopiedItem(`awaited testing`));
	// ContentScriptProxyStore.dispatch(
	// 	addCopiedItem(`next testing is without await or promise.all`)
	// );
	// const latestState = await ContentScriptProxyStore.getState();
	// console.log(`Latest state is : `, latestState);
}

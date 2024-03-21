// import './MainContent.jsx';
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/constants.js';
import { sendMessage, onMessage } from 'webext-bridge/content-script';
import ProxyStore from '../chromeStorageRedux/ProxyStore.js';

console.log(`inside content script on gitlab.com`);
// window.addEventListener('load', onWindowLoaded, false);

setTimeout(onWindowLoaded, 4000);

function onWindowLoaded() {
	console.log(`allwebPages.jsx - window loaded`);
	setTimeout(testStoreAccess, 2000);
}

async function testStoreAccess() {
	const proxyStore = new ProxyStore(EXTENSIONS_CONTEXTS.CONTENT_SCRIPT);

	proxyStore.ready(() => {
		proxyStore.subscribe(async () => {
			console.log(
				`Inside content script - Backend Store Subscription listener`
			);
			const newState = await proxyStore.getState();
			console.log(
				`Latest state post subscription listener calling : `,
				newState
			);
		});
	});
}

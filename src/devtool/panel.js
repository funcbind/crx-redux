/* eslint-disable no-undef */
console.log(`inside panel.js`);
import { EXTENSIONS_CONTEXTS } from '../chromeStorageRedux/contants.js';
import ProxyStore from '../chromeStorageRedux/proxyStore.js';
import { sendMessage } from 'webext-bridge/devtools';

setTimeout(() => {
	const DevtoolsProxyStore = new ProxyStore(
		EXTENSIONS_CONTEXTS.DEVTOOLS,
		sendMessage,
		onMessage
	);
}, 6000);

const types = {};
chrome.devtools.inspectedWindow.getResources((resources) => {
	resources.forEach((resource) => {
		if (!(resource.type in types)) {
			types[resource.type] = 0;
		}
		types[resource.type] += 1;
	});
	let result = `Resources on this page: 
  ${Object.entries(types)
		.map((entry) => {
			const [type, count] = entry;
			return `${type}: ${count}`;
		})
		.join('\n')}`;
	let div = document.createElement('div');
	div.innerText = result;
	document.body.appendChild(div);
});

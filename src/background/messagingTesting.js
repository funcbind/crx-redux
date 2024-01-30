import { sendMessage, onMessage } from 'webext-bridge/background';

onMessage('content-back', (message) => {
	const {
		sender: { tabId },
		data,
	} = message;

	console.log(`message received from popup : `, data, tabId);

	// setTimeout(async () => {
	// 	const dataFromContentScript = await sendMessage(
	// 		'back-content',
	// 		{ id: 1, name: 'kishore', age: 45 },
	// 		`content-script@${tabId}`
	// 	);
	// 	console.log(`data from Content Script`, dataFromContentScript);
	// }, 7000);

	return deferredResponseBack();
});

function deferredResponseBack() {
	const promise = new Promise((resolve) => {
		setTimeout(() => {
			resolve({ id: 1, name: 'kishore', age: 45 });
		}, 5000);
	});

	return promise;
}

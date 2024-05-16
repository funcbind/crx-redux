import { getBrowserAPI, ActionTypes } from './utils';
import { COMMUNICATION_MESSAGE_IDS } from './constants';

export default function connectToOtherPartsEnhancer(createStore) {
	return async (reducer, preLoadedState) => {
		const store = await createStore(reducer, preLoadedState);
		broadcastMessageToOtherParts(
			'STORE_SUBSCRIPTION_BROADCAST',
			{
				context: undefined,
				action: { type: ActionTypes.INIT },
			},
			true
		);
		listenToStoreExistenceCallFromOtherContexts();
		listenToDispatchCallsFromOtherContexts(store.dispatch);

		return {
			...store,
		};
	};
}

function listenToDispatchCallsFromOtherContexts(dispatch) {
	const browser = getBrowserAPI();
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.type === COMMUNICATION_MESSAGE_IDS.DISPATCH_TO_STORE) {
			let { action, context } = message;
			dispatch(action, null, context)
				.then((actionObj) => {
					console.log(
						`\n ##dispatchCallsFromOtherPartsListener() - background store dispatch call successful`,
						actionObj
					);
					broadcastMessageToOtherParts('STORE_SUBSCRIPTION_BROADCAST', {
						context,
						action: actionObj,
					});
					sendResponse(actionObj); // return response;
				})
				.catch((e) => {
					console.error(`dispatchCallsFromOtherPartsListener() - error`, e);
					sendResponse({
						error: `${e}`,
					});
				});
			return true;
		}
	});
}

function listenToStoreExistenceCallFromOtherContexts() {
	const browser = getBrowserAPI();
	browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.type === COMMUNICATION_MESSAGE_IDS.CHECK_STORE_EXISTENCE) {
			sendResponse(COMMUNICATION_MESSAGE_IDS.BACKGROUND_STORE_AVAILABLE);
		}
	});
}

async function broadcastMessageToOtherParts(
	broadcastMessage,
	responseData,
	isInitActionDispatchBroadcast
) {
	// broadcasting to all content scripts
	const extensionId = chrome.runtime.id;
	const broadcastMessageCode = COMMUNICATION_MESSAGE_IDS[broadcastMessage];
	const { context } = responseData;

	if (!broadcastMessageCode) {
		throw new Error(
			`broadcastMessageToOtherParts() - Broadcast Message Code Not found : ${broadcastMessage}`
		);
	}

	if (isInitActionDispatchBroadcast) {
		console.log(
			`broadcastMessageToOtherParts() - INIT Action Dispatch Broadcast`,
			broadcastMessage,
			` ==== Execution Context : `,
			context
		);
	} else {
		// console.log(
		// 	`broadcastMessageToOtherParts() - Message To Broadcast`,
		// 	broadcastMessage,
		// 	`  === Execution Context : `,
		// 	context
		// );
	}

	const browser = getBrowserAPI();

	browser.tabs.query({}, (tabs = []) => {
		for (const tab of tabs) {
			const { id: tabId, url: tabUrl } = tab;

			if (typeof tabUrl !== 'string') {
				throw new Error(
					`Tabs permission missing in Manifest`,
					`\n Add tabs permission in manifest as follows: `,
					`\n "permissions": ["storage", "unlimitedStorage", "tabs"]`
				);
			}

			if (!tabUrl.includes(extensionId)) {
				// console.log(`Tab Details : Id : ${tabId}         url : ${tabUrl}`);

				browser.tabs.sendMessage(
					tabId,
					{
						type: broadcastMessageCode,
						responseData,
					},
					(response) => {
						// console.log(
						// 	`Response from tabs for broadcast Message : ${messageToBroadcast} : `,
						// 	response
						// );
						const lastError = browser.runtime.lastError;
						if (lastError) {
							// console.warn(
							// 	`Some error occured in broadcasting store subscription to `,
							// 	`content script with tab Id : ${tabId} & tab url : ${tabUrl}`,
							// 	lastError
							// );
						}
					}
				);
			}
		}
	});

	// broadcast to all other parts
	browser.runtime.sendMessage(
		{
			type: broadcastMessageCode,
			responseData,
		},
		(response) => {
			// console.log(`broadcastMessageToOtherParts() - response`, response);
			const lastError = browser.runtime.lastError;

			if (lastError) {
				// console.warn(
				// 	`Some error occured in broadcasting store subscription to popup, option, devtools etc`,
				// 	lastError
				// );
			}
		}
	);
}

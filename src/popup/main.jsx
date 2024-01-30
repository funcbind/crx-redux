import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import Popup from './Popup.jsx';
import '../index.css';
import { Store as ProxyStore } from 'webext-redux';
import {
	addCopiedItem,
	// deleteCopiedItem,
	// reverseCopiedItems,
	// clearClipboard,
	// editCopiedItem,
	// getCopiedItem,
	getCopiedItems,
} from '../common/clipboardItemsReducer';

console.log(`This is the Popup file!!!`);

const proxyStore = new ProxyStore();

proxyStore.ready(() => {
	ReactDOM.createRoot(document.getElementById('root')).render(
		<React.StrictMode>
			<Popup />
		</React.StrictMode>
	);

	const clipboardItems = getCopiedItems(proxyStore.getState());
	console.log(`clipboard items : `, clipboardItems);
	const thirdCopiedItemId = clipboardItems?.[2]?.id;
	console.log(`third copied item id : `, thirdCopiedItemId);
	// await proxyStore.dispatch(deleteCopiedItem(thirdCopiedItemId));
	const updatedClipboardItems = getCopiedItems(proxyStore.getState());
	console.log(`clipboard items : `, updatedClipboardItems);
});

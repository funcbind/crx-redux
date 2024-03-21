import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options.jsx';
import '../index.css';
import getProxyStore from '../chromeStorageRedux/ProxyStore.js';

console.log(`This is the Options file!!!`);

const proxyStore = getProxyStore();

proxyStore.ready(async () => {
	console.log(`Options Proxy Store is now ready`);

	ReactDOM.createRoot(document.getElementById('root')).render(
		<React.StrictMode>
			<Options proxyStore={proxyStore} />
		</React.StrictMode>
	);

	proxyStore.subscribe(async () => {
		const latestState = await proxyStore.getState();
		console.log(
			`Inside Options - main.jsx - Backend Store Subscription listener`,
			latestState
		);
	});
});

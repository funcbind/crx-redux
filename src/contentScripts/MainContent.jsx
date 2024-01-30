// eslint-disable-next-line no-unused-vars
import React from 'react';
import ReactDOM from 'react-dom/client';
import MainContent from './MainContent.jsx';
import { sendMessage, onMessage } from 'webext-bridge/content-script';
// import styles1 from '../index.css?inline';
// import styles2 from '../App.css?inline';

const contentRoot = document.createElement('div');
contentRoot.id = 'nc-root';
const shadowRoot = contentRoot.attachShadow({ mode: 'open' });
const shadowWrapper = document.createElement('div');
shadowWrapper.id = 'root';
document.body.append(contentRoot);
shadowRoot.append(shadowWrapper);

// Attach a shadow root to the host
ReactDOM.createRoot(shadowWrapper).render(
	<React.StrictMode>
		{/* <style type='text/css'>
			{styles1}
			{styles2}
		</style> */}
		<MainContent />
	</React.StrictMode>
);

export default function MainContent() {
	async function handleCountBtnClick() {
		console.log(`inside handleCountBtnClick function`);
		const dataFromOptions = await sendMessage(
			'content-options',
			{ name: 'bhavya', age: 34 },
			'options'
		);
		console.log(`Data received back from Options : `, dataFromOptions);
		return 'hello from Options';
	}

	return (
		<section id='main-container'>
			<h3>This is the main container of the content script</h3>
			<button onClick={handleCountBtnClick}>Click Me!</button>
		</section>
	);
}

onMessage('options-content', (message) => {
	console.log(`message received from Options : `, message);
	return 'hello from Content Script';
});

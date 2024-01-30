/* global chrome */

import { useState } from 'react';
import { sendMessage, onMessage } from 'webext-bridge/popup';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';
import './popup.scss';

function Popup() {
	const [count, setCount] = useState(0);

	async function handleCountBtnClick() {
		console.log(`inside handleCountBtnClick function`);
		setCount((count) => count + 1);
		const dataFromBackground = await sendMessage(
			'popup-options1',
			{ name: 'bhavya', age: 34 },
			'background'
		);
		console.log(`Data received back from background : `, dataFromBackground);
	}

	return (
		<>
			<div>
				<a href='https://vitejs.dev' target='_blank' rel='noreferrer'>
					<img
						src={chrome.runtime.getURL(viteLogo)}
						className='logo'
						alt='Vite logo'
					/>
				</a>
				<a href='https://react.dev' target='_blank' rel='noreferrer'>
					<img
						src={chrome.runtime.getURL(reactLogo)}
						className='logo react'
						alt='React logo'
					/>
				</a>
			</div>
			<h1>Vite + React</h1>
			<div className='card'>
				<button onClick={handleCountBtnClick}>Counter is {count}</button>
				<p>Testing further changes...</p>
			</div>
			<p className='read-the-docs'>
				Click on the Vite and React logos to learn more
			</p>
		</>
	);
}

onMessage('content-popup', (message) => {
	const {
		sender: { tabId },
		data,
	} = message;

	console.log(`message received from content SCript : `, data, tabId);

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

export default Popup;

/* global chrome */

import { useState } from 'react';
// import { sendMessage, onMessage } from 'webext-bridge/options';
import reactLogo from '../assets/react.svg';
import viteLogo from '/vite.svg';
import './options.scss';
import { addCopiedItem } from '../common/clipboardItemsReducer';

export default function Options() {
	const [count, setCount] = useState(0);

	async function handleCountBtnClick() {
		console.log(`inside handleCountBtnClick function`);
		setCount((count) => count + 1);
		// const dataFromBackground = await sendMessage(
		// 	'options-content',
		// 	{ name: 'bhavya', age: 34 },
		// 	'content-script'
		// );
		// console.log(`Data received back from background : `, dataFromBackground);
		testStoreAccess(count);
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

async function testStoreAccess(count, proxyStore) {
	const dispatchResponse = await proxyStore.dispatch(
		addCopiedItem(`Copied Text : ${count}`)
	);
	const latestState = await proxyStore.getState();
	console.log(
		`testStoreAccess() : dispatchResponse - `,
		dispatchResponse,
		`\nlatestState - `,
		latestState
	);
}

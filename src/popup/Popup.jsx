/* global chrome */

import { useState } from 'react';
import reactLogo from '../assets/react.svg';
import './popup.scss';
import viteLogo from '/vite.svg';
// import PopupProxyStore from '../chromeStorageRedux/PopupProxyStore';
import { addCopiedItem } from '../common/clipboardItemsReducer';

function Popup() {
	const [count, setCount] = useState(0);

	async function handleCountBtnClick() {
		console.log(`inside handleCountBtnClick function`);
		setCount((count) => count + 1);
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

async function testStoreAccess(count) {
	// await PopupProxyStore.dispatch(addCopiedItem(`Copied Text : ${count}`));
	// const response = await ProxyStore.getState();
	// console.log(`Popup.jsx - ProxyStore Dispatch response : `, response);
}

export default Popup;

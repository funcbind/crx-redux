/* global chrome */

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import reactLogo from '../assets/react.svg';
import './popup.scss';
import viteLogo from '/vite.svg';
// import PopupProxyStore from '../chromeStorageRedux/PopupProxyStore';
import {
	addCopiedItem,
	deleteCopiedItem,
} from '../common/clipboardItemsReducer';

// eslint-disable-next-line react/prop-types
function Popup() {
	const [count, setCount] = useState(0);
	const dispatch = useDispatch();
	let copiedItems = useSelector((state) => {
		console.log(`inside useSelector hook : `, state);
		return state.clipboardItems;
	});
	copiedItems = copiedItems || [];

	async function handleCountBtnClick() {
		console.log(`inside handleCountBtnClick function`);
		setCount((count) => count + 1);
		// testStoreAccess(count, dispatch);
		const dispatchResponse = await dispatch(
			addCopiedItem(`Copied Text : ${count}`)
		);
		// const latestState = await proxyStore.getState();
		console.log(
			`testStoreAccess() : dispatchResponse - `,
			dispatchResponse,
			`\nlatestState - `
		);
	}

	function handleCopiedItemDeletion(itemToDeleteId) {
		console.log(`Inside handle Copied Item Deletion : `, itemToDeleteId);
		dispatch(deleteCopiedItem(itemToDeleteId));
	}

	return (
		<>
			<section>
				<h2>Copied Items List : </h2>

				<ul>
					{copiedItems.map((copiedItem) => (
						<li key={copiedItem.id}>
							{copiedItem.text}
							<span
								className='font-bold'
								onClick={() => handleCopiedItemDeletion(copiedItem.id)}
							>
								X
							</span>
						</li>
					))}
				</ul>
			</section>
			<br />
			<br />
			<div className='card'>
				<button onClick={handleCountBtnClick}>Counter is {count}</button>
				<p>Testing further changes...</p>
			</div>
		</>
	);
}

export default Popup;

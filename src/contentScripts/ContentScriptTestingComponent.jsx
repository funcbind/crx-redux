// eslint-disable-next-line no-unused-vars
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	addCopiedItem,
	deleteCopiedItem,
	getCopiedItems,
	clearClipboard,
	reverseCopiedItems,
} from '../common/clipboardItemsReducer';
import {
	decrementTestingCounter,
	getTestingCounter,
	incrementTestingCounter,
} from '../common/testingCounterReducer';

console.log(`Inside ContentScriptTestingComponent.jsx`);

export default function MainContent() {
	const [newCopiedItemText, setNewCopiedItemText] = useState(``);
	const dispatch = useDispatch();
	const testingCounter = useSelector(getTestingCounter);
	let copiedItems = useSelector(getCopiedItems);
	copiedItems = copiedItems || [];

	function handleAddNewCopiedItem() {
		console.log(`Inside handle Add New Copied Item`);
		let tempNewCopiedItemText = newCopiedItemText;
		if (newCopiedItemText === ``) {
			tempNewCopiedItemText = `Copied Item ${randomIntFromInterval(100, 1000)}`;
		}
		console.log(`New Copied Item text : `, tempNewCopiedItemText);
		dispatch(addCopiedItem(tempNewCopiedItemText));
		setNewCopiedItemText(``);
	}

	function handleCopiedItemDeletion(itemToDeleteId) {
		console.log(`Inside handle Copied Item Deletion : `, itemToDeleteId);
		dispatch(deleteCopiedItem(itemToDeleteId));
	}

	function handleClearAllCopiedItems() {
		console.log(`Inside handle Clear All Copied Items`);
		dispatch(clearClipboard());
	}

	function handleReverseAllCopiedItems() {
		console.log(`Inside handle Reverse All Copied Items`);
		dispatch(reverseCopiedItems());
	}

	function handleTestingCounterAction(action) {
		const dispatchFn =
			action === 'increment'
				? incrementTestingCounter
				: decrementTestingCounter;
		dispatch(dispatchFn());
	}

	return (
		<>
			<h2>Copied Items List : </h2>
			<h3>
				Testing Counter Count : <b>{testingCounter}</b>
			</h3>

			<ul className='max-h-48 mb-1 overflow-y-auto p-1'>
				{copiedItems.map((copiedItem) => (
					<li key={copiedItem.id}>
						<span>{copiedItem.text}</span>
						<span
							title='Remove Copied Item'
							onClick={() => handleCopiedItemDeletion(copiedItem.id)}
							className='inline-block pl-4 cursor-pointer'
						>
							X
						</span>
					</li>
				))}
			</ul>

			<section className='flex flex-col mb-2'>
				<h3>Copied Items Controls</h3>
				<section>
					<textarea
						className='w-full h-[50px] border-solid border-[1px] border-slate-400'
						name=''
						onChange={(e) => setNewCopiedItemText(e.target.value)}
						value={newCopiedItemText}
					></textarea>
					<button onClick={handleAddNewCopiedItem}>Add Copied Item</button>
				</section>
				<button onClick={handleClearAllCopiedItems}>Clear All</button>
				<button onClick={handleReverseAllCopiedItems}>Reverse All</button>
			</section>

			<section className=''>
				<button onClick={() => handleTestingCounterAction('increment')}>
					Increment Testing Counter
				</button>
				<button onClick={() => handleTestingCounterAction('decrement')}>
					Decrement Testing Counter
				</button>
			</section>
		</>
	);
}

function randomIntFromInterval(min, max) {
	// min and max included
	return Math.floor(Math.random() * (max - min + 1) + min);
}

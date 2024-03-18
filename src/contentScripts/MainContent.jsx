// eslint-disable-next-line no-unused-vars
import React from 'react';
import ReactDOM from 'react-dom/client';
import ContentScriptProxyStore from '../chromeStorageRedux/ContentScriptProxyStore';
import { addCopiedItem } from '../common/clipboardItemsReducer';
// import styles1 from '../index.css?inline';
// import styles2 from '../App.css?inline';

console.log(`Inside MainContent.jsx`);

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
		<style type='text/css'>
			{/* {styles1}
			{styles2} */}
		</style>
		<MainContent />
	</React.StrictMode>
);

export default function MainContent() {
	const [count, setCount] = React.useState(0);

	function handleCountBtnClick() {
		console.log(`Content Script - inside handleCountBtnClick function`);
		setCount((count) => count + 1);
		testProxyStoreMethods(count);
	}
	return (
		<section id='main-container'>
			<h3>This is the main container of the content script</h3>
			<button onClick={handleCountBtnClick}>Counter is {count}</button>
		</section>
	);
}

function testProxyStoreMethods(count) {
	ContentScriptProxyStore.dispatch(addCopiedItem(`Copied Text : ${count}`));
}

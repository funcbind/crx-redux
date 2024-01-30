import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options.jsx';
import '../index.css';
console.log(`This is the Options file!!!`);

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<Options />
	</React.StrictMode>
);

/* eslint-disable no-undef */
import { CHROME_REDUX_CONSTANTS, EXTENSIONS_CONTEXTS } from './constants';
// import browser from 'webextension-polyfill';

const randomString = () =>
	Math.random().toString(36).substring(7).split('').join('.');

export const ActionTypes = {
	INIT: `@@redux/INIT${/* #__PURE__ */ randomString()}`,
	REPLACE: `@@redux/REPLACE${/* #__PURE__ */ randomString()}`,
	PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`,
};

export function isPlainObject(obj) {
	if (typeof obj !== 'object' || obj === null) return false;

	let proto = obj;
	while (Object.getPrototypeOf(proto) !== null) {
		proto = Object.getPrototypeOf(proto);
	}

	return (
		Object.getPrototypeOf(obj) === proto || Object.getPrototypeOf(obj) === null
	);
}

// Inlined / shortened version of `kindOf` from https://github.com/jonschlinkert/kind-of
export function miniKindOf(val) {
	if (val === void 0) return 'undefined';
	if (val === null) return 'null';

	const type = typeof val;
	switch (type) {
		case 'boolean':
		case 'string':
		case 'number':
		case 'symbol':
		case 'function': {
			return type;
		}
	}

	if (Array.isArray(val)) return 'array';
	if (isDate(val)) return 'date';
	if (isError(val)) return 'error';

	const constructorName = ctorName(val);
	switch (constructorName) {
		case 'Symbol':
		case 'Promise':
		case 'WeakMap':
		case 'WeakSet':
		case 'Map':
		case 'Set':
			return constructorName;
	}

	// other
	return Object.prototype.toString
		.call(val)
		.slice(8, -1)
		.toLowerCase()
		.replace(/\s/g, '');
}

function ctorName(val) {
	return typeof val.constructor === 'function' ? val.constructor.name : null;
}

function isError(val) {
	return (
		val instanceof Error ||
		(typeof val.message === 'string' &&
			val.constructor &&
			typeof val.constructor.stackTraceLimit === 'number')
	);
}

function isDate(val) {
	if (val instanceof Date) return true;
	return (
		typeof val.toDateString === 'function' &&
		typeof val.getDate === 'function' &&
		typeof val.setDate === 'function'
	);
}

export function kindOf(val) {
	let typeOfVal = typeof val;

	if (process.env.NODE_ENV !== 'production') {
		typeOfVal = miniKindOf(val);
	}

	return typeOfVal;
}

export const $$observable = /* #__PURE__ */ (() =>
	(typeof Symbol === 'function' && Symbol.observable) || '@@observable')();

export function getBrowserAPI() {
	let api;

	try {
		// eslint-disable-next-line no-undef
		api = self.chrome || self.browser || browser;
	} catch (error) {
		// eslint-disable-next-line no-undef
		api = browser;
	}

	if (!api) {
		throw new Error('Browser API is not present');
	}

	return api;
}

export function shallowDiff(oldObj, newObj) {
	const difference = [];

	Object.keys(newObj).forEach((key) => {
		if (oldObj[key] !== newObj[key]) {
			difference.push({
				key,
				value: newObj[key],
				change: CHROME_REDUX_CONSTANTS.DIFF_STATUS_UPDATED,
			});
		}
	});

	Object.keys(oldObj).forEach((key) => {
		if (!Object.prototype.hasOwnProperty.call(newObj, key)) {
			difference.push({
				key,
				change: CHROME_REDUX_CONSTANTS.DIFF_STATUS_REMOVED,
			});
		}
	});

	return difference;
}

export function getContextType() {
	const browser = getBrowserAPI();
	const manifest = browser.runtime.getManifest();

	// console.log(`manifest`, manifest);

	const isContentScript = Boolean(
		!browser.tabs && browser.extension && browser.runtime.getURL
	);
	const isOffscreen = Boolean(
		!browser.tabs && !browser.extension && browser.runtime.getURL
	);
	const isOptionsPage =
		Boolean(browser.tabs) &&
		location.href ===
			browser.runtime.getURL(
				manifest.options_page || manifest.options_ui?.page || ''
			);
	// this will be wrong when using browser.action.setPopup with a different path
	const isPopupPage =
		Boolean(browser.tabs) &&
		location.href ===
			browser.runtime.getURL(
				(manifest.action || manifest.browser_action)?.default_popup
			);
	const isDevtools = Boolean(browser.devtools);

	const getBackgroundPageFn = browser.extension?.getBackgroundPage;
	const isBackgroundPage =
		manifest.manifest_version === 3
			? typeof ServiceWorkerGlobalScope === 'function'
			: getBackgroundPageFn === window;

	const activeContexts = {
		[EXTENSIONS_CONTEXTS.CONTENT_SCRIPT]: isContentScript,
		[EXTENSIONS_CONTEXTS.OFFSCREEN]: isOffscreen,
		[EXTENSIONS_CONTEXTS.OPTIONS]: isOptionsPage,
		[EXTENSIONS_CONTEXTS.POPUP]: isPopupPage,
		[EXTENSIONS_CONTEXTS.DEVTOOLS]: isDevtools,
		[EXTENSIONS_CONTEXTS.BACKGROUND]: isBackgroundPage,
	};

	// console.log(`Utils -> getContextType() :  Active Contexts: `, activeContexts);

	const activeContextsCount = Object.values(activeContexts).filter(
		(activeContext) => Boolean(activeContext)
	);

	const moreThanOneActiveContext = activeContextsCount.length > 1;
	const noActiveContext = activeContextsCount.length === 0;

	if (moreThanOneActiveContext) {
		throw new Error(
			`Utils -> getContextType() : Multiple active contexts found : Some Testing Method Failed`
		);
	}

	if (noActiveContext) {
		throw new Error(
			`Utils -> getContextType() : No active context found : Some Testing Method Failed`
		);
	}

	let contextType = '';
	for (let [key, value] of Object.entries(activeContexts)) {
		if (value) {
			contextType = key;
			break;
		}
	}

	if (contextType === '') {
		throw new Error(
			`Utils -> getContextType() : Right context not found : Some Testing Method Failed`
		);
	}

	// console.log(`Utils.js : getContextType() - contextType : `, contextType);

	return contextType;
}

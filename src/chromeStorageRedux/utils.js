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

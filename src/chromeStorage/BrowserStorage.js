/* eslint-disable no-undef */
import { isPlainObject } from '../chromeStorageRedux/utils';

// console.log(`Inside StorageWrapper file : `, process.env.NODE_ENV);
const isDevEnvironment = process.env.NODE_ENV === 'development';

class BrowserStorage {
	#possibleStorageOptions = ['local', 'sync', 'session'];
	#storageToUse = '';
	#loggingEnabled = false;
	#storageNameSpace = chrome.storage;
	#activeStorage = null;

	constructor(storageToUse) {
		this.#storageToUse = storageToUse;
		this.#activeStorage = chrome.storage[storageToUse];
	}

	static storageTypes = {
		LOCAL: 'local',
		SYNC: 'sync',
		SESSION: 'session',
	};

	get(keys = null) {
		if (
			typeof keys !== 'string' &&
			!isPlainObject(keys) &&
			!Array.isArray(keys) &&
			keys !== null
		) {
			throw new Error(
				'Wrong Argument Passed. Single Arguement Required : String || Array<strings> || Plain Object'
			);
		}

		return this.#getData(keys);
	}

	#getData(keys) {
		return new Promise((resolve, reject) => {
			try {
				this.#activeStorage.get(keys, (data) => {
					// if single key is passed
					if (typeof keys === 'string') {
						data = data[keys];
					}

					if (this.#loggingEnabled && isDevEnvironment) {
						console.log(
							`BROWSER STORAGE WRAPPER : RETRIEVED DATA FROM STORAGE :`,
							data
						);
					}
					resolve(data);

					if (this.#loggingEnabled && isDevEnvironment) {
						console.log(
							`BROWSER STORAGE WRAPPER : RETRIEVED DATA FROM STORAGE :`,
							data
						);
					}
					resolve(data);
				});
			} catch (error) {
				reject(
					new Error(
						`Some error occured while Getting the data from chrome storage\n Error: ${error}`
					)
				);
			}
		});
	}

	save() {
		let key, data;

		if (arguments.length === 1) {
			data = arguments[0];
			if (!isPlainObject(data)) {
				throw new Error('First Arguement i.e Data should be a plain object');
			}
			return this.#saveData(data);
		}

		if (arguments.length === 2) {
			key = arguments[0];
			data = arguments[1];
			if (typeof key !== 'string') {
				throw new Error('First Argument should be a string');
			}
			if (!isPlainObject(data)) {
				throw new Error('Second Arguement i.e Data should be a plain object');
			}
			return this.#saveData({
				[key]: data,
			});
		}
	}

	#saveData(data) {
		return new Promise((resolve, reject) => {
			try {
				this.#activeStorage.set(data, () => {
					if (this.#loggingEnabled && isDevEnvironment) {
						console.log(
							`BROWSER STORAGE WRAPPER : SAVED DATA TO STORAGE :`,
							data
						);
					}
					resolve();
				});
			} catch (error) {
				reject(
					new Error(
						`Some error occured while Setting the data to chrome storage\n Error: ${error}`
					)
				);
			}
		});
	}

	clear() {
		return new Promise((resolve, reject) => {
			try {
				this.#activeStorage.clear(() => {
					if (this.#loggingEnabled && isDevEnvironment) {
						console.log(`BROWSER STORAGE WRAPPER : CLEARED STORAGE`);
					}
					resolve();
				});
			} catch (error) {
				reject(
					new Error(
						`Some error occured while clearing chrome storage\n Error: ${error}`
					)
				);
			}
		});
	}

	delete(key) {
		if (typeof key !== 'string' && !Array.isArray(key)) {
			throw new Error(
				'Wrong Argument Passed. Required Argument : String or Array<strings>'
			);
		}

		return new Promise((resolve, reject) => {
			try {
				this.#activeStorage.remove(key, () => {
					if (this.#loggingEnabled && isDevEnvironment) {
						console.log(
							`BROWSER STORAGE WRAPPER : DELETED KEYS FROM STORAGE :`,
							key
						);
					}
					resolve();
				});
			} catch (error) {
				reject(
					new Error(
						`Some error occured while deleting the data from chrome storage\n Error: ${error}`
					)
				);
			}
		});
	}

	addChangesListener(callback) {
		return this.#storageNameSpace.onChanged.addListener(callback);
	}

	removeChangesListener(callback) {
		return this.#storageNameSpace.onChanged.removeListener(callback);
	}

	getMemoryUsage(keys) {
		if (typeof keys !== 'string' && !Array.isArray(keys) && keys !== null) {
			throw new Error(
				'Wrong Argument Passed : Arguments Required - String or Array<strings> or null'
			);
		}

		return new Promise((resolve, reject) => {
			try {
				this.#activeStorage.getBytesInUse(keys, (bytesInUse) => {
					if (bytesInUse < 1024) {
						resolve(`${bytesInUse} bytes`);
					} else if (bytesInUse >= 1024) {
						resolve(`${(bytesInUse / 1024).toFixed(2)} MB`);
					}
				});
			} catch (error) {
				reject(
					new Error(
						`Some error occured while Getting the memory usage from chrome storage\n Error: ${error}`
					)
				);
			}
		});
	}

	setLoggingStatus(loggingStatus) {
		if (typeof loggingStatus !== 'boolean') {
			throw new Error(
				'Wrong Argument Passed : Single Arguments Required : boolean'
			);
		}
		this.#loggingEnabled = loggingStatus;
	}
}

export const LocalStorage = new BrowserStorage(
	BrowserStorage.storageTypes.LOCAL
);
export const SyncStorage = new BrowserStorage(
	BrowserStorage.storageTypes.SESSION
);
export const SessionStorage = new BrowserStorage(
	BrowserStorage.storageTypes.SYNC
);

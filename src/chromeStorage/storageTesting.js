/* eslint-disable no-unused-vars */
// import sizeof from 'object-sizeof';
import { LocalStorage } from './storageLib';

export function generateRandomWord() {
	const letters = 'abcdefghijklmnopqrstuvwxyz';
	const wordLength = Math.floor(Math.random() * 6) + 10; // Random length between 10 and 15

	let randomWord = '';
	for (let i = 0; i < wordLength; i++) {
		const randomIndex = Math.floor(Math.random() * letters.length);
		randomWord += letters[randomIndex];
	}

	return randomWord;
}

export function createMockObject(numKeys) {
	const mockObject = {};

	for (let i = 0; i < numKeys; i++) {
		const key = `key${i}`;
		mockObject[key] = generateRandomWord();
	}

	return mockObject;
}

async function storageTestingRaw() {
	console.time('Setting chrome storage');
	await chrome.storage.local.set({
		'redux-store-testing': mockData,
	});
	console.timeEnd('Setting chrome storage');

	console.time('Getting chrome storage');
	const savedMockData = await chrome.storage.local.get();
	console.timeEnd('Getting chrome storage');
	console.log(savedMockData);

	// const sizeOfData = await chrome.storage.local.getBytesInUse();
	// console.log(`Size of data stored in chrome storage : `, sizeOfData);

	// console.time('Clearing chrome storage');
	// await chrome.storage.local.clear();
	// console.timeEnd('Clearing chrome storage');

	// console.time('Again getting chrome storage');
	// const mockDataPostClear = await chrome.storage.local.get([
	// 	'redux-store-testing',
	// ]);
	// console.timeEnd('Again getting chrome storage');
	// console.log(mockDataPostClear);
}

export async function testingSavingData(data) {
	await LocalStorage.save(data);
	const savedData = await LocalStorage.get();
	console.log(
		`>> Testing - Saved Data using data object directly: `,
		savedData
	);
	return savedData;
}

export async function testingSavingDataInKey(key, data) {
	await LocalStorage.save(key, data);
	const savedData = await LocalStorage.get(key, data);
	console.log(`>> Testing - Saved Data post saving in a key : `, savedData);
	return savedData;
}

export async function testingGettingData(keys = null) {
	const savedData = await LocalStorage.get(keys);
	console.log(`>> Testing - Getting Data : `, keys, savedData);
	return savedData;
}

export async function testingClearingAllData() {
	await LocalStorage.clear();
	const savedData = await LocalStorage.get();
	console.log(`>> Testing -Data post Clearing : `, savedData);
	return savedData;
}

export async function testingDeletingDataInKey(keys) {
	await LocalStorage.delete(keys);
	const savedData = await LocalStorage.get();
	console.log(`>> Testing - Data post Delete in a key : `, keys, savedData);
	return savedData;
}

export async function testingMemoryInUse(keys = null) {
	const memoryInUse = await LocalStorage.getMemoryUsage(keys);
	console.log(`>> Testing - Memory in use : `, keys, memoryInUse);
	return memoryInUse;
}

export async function runStorageLibTests(
	saveAtRandomKey = false,
	mockDataSize = 33,
	mockDataSize2 = 47
) {
	console.log(`>>> RUNNING STORAGE LIB TESTER`);
	try {
		LocalStorage.addChangesListener(addChangesListener);
		await testingClearingAllData();
		const mockData1 = createMockObject(mockDataSize);
		const mockData2 = createMockObject(mockDataSize2);
		const randomKey1 = `key-${generateRandomWord()}`;
		const randomKey2 = `key-${generateRandomWord()}`;
		//saving data
		if (!saveAtRandomKey) {
			await testingSavingData(mockData1);
		} else {
			//saving data at a key
			await testingSavingDataInKey(randomKey1, mockData1);
			await testingSavingDataInKey(randomKey2, mockData2);
		}
		//getting all data
		await testingGettingData();

		if (!saveAtRandomKey) {
			//getting data at a key
			await testingGettingData('key5');
			//getting data at multiple keys
			await testingGettingData(['key5', 'key6', 'keys1', 'key4']);
		} else {
			await testingGettingData(randomKey1);
			await testingGettingData(randomKey2);
			await testingGettingData([randomKey1, randomKey2]);
		}

		//Memory in use at a particular Key
		if (!saveAtRandomKey) {
			//Memory in use
			await testingMemoryInUse();
			// Memory In use at multiple keys
			const mockDataKeys = Object.keys(mockData1);
			const halfKeys = mockDataKeys.splice(0, mockDataKeys.length / 2);
			await testingMemoryInUse(halfKeys);
		} else {
			await testingMemoryInUse(randomKey1);
			await testingMemoryInUse(randomKey2);
			await testingMemoryInUse([randomKey1, randomKey2]);
		}

		if (!saveAtRandomKey) {
			//deleting data at a key
			await testingDeletingDataInKey('key1');
			//deleting data at multiple keys
			await testingDeletingDataInKey(['key2', 'key3', 'key4']);
		} else {
			await testingDeletingDataInKey(randomKey1);
		}

		//clearing all data
		await testingClearingAllData();
	} catch (error) {
		console.log(`Inside Storage Lib - Some error occured`, error);
	}
	console.log(`>>> ENDING STORAGE LIB TESTER`);
	LocalStorage.removeChangesListener(addChangesListener);
}

function addChangesListener(changes) {
	console.log(`>>> Test : Changes Listener Called : `, changes);
}

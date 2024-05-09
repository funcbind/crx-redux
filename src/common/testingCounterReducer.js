import { createSlice } from '@reduxjs/toolkit';

const testingCounterSlice = createSlice({
	name: 'testingCounter',
	initialState: {},
	reducers: {
		incrementTestingCounter(state) {
			state.count += 1;
		},
		decrementTestingCounter(state) {
			state.count -= 1;
		},
		clearTestingCounter(state) {
			state.count = 0;
		},
	},
});

export default testingCounterSlice.reducer;
export const { incrementTestingCounter, decrementTestingCounter } =
	testingCounterSlice.actions;

export const getTestingCounter = (state) => state.testingCounter.count;

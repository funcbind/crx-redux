import { createSlice, nanoid } from '@reduxjs/toolkit';

// const initialState = [];

const clipboardItemsSlice = createSlice({
	name: 'copiedItems',
	initialState: null,
	reducers: {
		addCopiedItem: {
			reducer: (state, action) => {
				let copiedItem = action.payload;
				state.push(copiedItem);
			},
			prepare: (text) => {
				const id = nanoid();
				return {
					payload: {
						id,
						text,
					},
				};
			},
		},
		deleteCopiedItem(state, action) {
			const id = action.payload;
			const index = state.findIndex((copy) => copy.id === id);
			if (index > -1) {
				state.splice(index, 1);
			} else return state;
		},
		clearClipboard(state) {
			state.length = 0;
		},
		reverseCopiedItems(state) {
			// eslint-disable-next-line no-unused-vars
			state = state.reverse();
		},
		editCopiedItem: {
			reducer(state, action) {
				const { id, text } = action.payload;
				const index = state.findIndex((copy) => copy.id === id);
				state[index].text = text;
			},
			prepare: (id, text) => {
				return {
					payload: {
						id,
						text,
					},
				};
			},
		},
	},
});

export default clipboardItemsSlice.reducer;
export const {
	addCopiedItem,
	deleteCopiedItem,
	reverseCopiedItems,
	clearClipboard,
	editCopiedItem,
} = clipboardItemsSlice.actions;

export const getCopiedItems = (state) => state.clipboardItems;
export const getCopiedItem = (state, id) =>
	state.clipboardItems.find((copy) => copy.id === id);

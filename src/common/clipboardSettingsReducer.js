import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
// 	visibleOnWebPages: true,
// 	opacity: 0.7,
// 	timeToDisappear: 1000, // in ms
// 	fifo: true
// };

const clipboardSettingsSlice = createSlice({
	name: 'settings',
	initialState: {},
	reducers: {
		toggleVisibilityOnWebPages(state) {
			state.visibleOnWebPages = !state.visibleOnWebPages;
		},
		setOpacity(state, action) {
			state.opacity = action.payload;
		},
		setTimeToDisappear(state, action) {
			state.timeToDisappear = action.payload;
		},
		toggleFifo(state) {
			state.fifo = !state.fifo;
		},
	},
});

export const {
	toggleVisibilityOnWebPages,
	setOpacity,
	setTimeToDisappear,
	toggleFifo,
} = clipboardSettingsSlice.actions;
export default clipboardSettingsSlice.reducer;

export const selectVisibleOnWebPages = (state) =>
	state.clipboardSettings.visibleOnWebPages;
export const selectOpacity = (state) => state.clipboardSettings.opacity;
export const selectTimeToDisappear = (state) =>
	state.clipboardSettings.timeToDisappear;
export const selectFifo = (state) => state.clipboardSettings.fifo;

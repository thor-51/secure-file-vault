// FILE: frontend/src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: localStorage.getItem('theme') || 'dark',
    toasts: [],
    sidebarOpen: true,
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
    },
    addToast: (state, action) => {
      state.toasts.push({ id: Date.now(), ...action.payload });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const { toggleTheme, addToast, removeToast, toggleSidebar } = uiSlice.actions;
export default uiSlice.reducer;

export const selectTheme = (state) => state.ui.theme;
export const selectToasts = (state) => state.ui.toasts;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;

// Helper thunk for adding auto-dismissing toasts
export const showToast = (message, type = 'info', duration = 3500) => (dispatch) => {
  const id = Date.now();
  dispatch(addToast({ id, message, type }));
  setTimeout(() => dispatch(removeToast(id)), duration);
};

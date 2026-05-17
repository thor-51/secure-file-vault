// FILE: frontend/src/store/slices/filesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { filesApi } from '../../api/index';

// ── Thunks ────────────────────────────────────────────────────────────

export const searchFiles = createAsyncThunk('files/search', async (params, { rejectWithValue }) => {
  try {
    const res = await filesApi.search(params);
    return { files: res.data.data, pagination: res.data.pagination };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Search failed');
  }
});

export const uploadFile = createAsyncThunk(
  'files/upload',
  async ({ formData, onProgress }, { rejectWithValue }) => {
    try {
      const res = await filesApi.upload(formData, onProgress);
      return res.data.data.file;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Upload failed');
    }
  }
);

export const deleteFile = createAsyncThunk('files/delete', async (id, { rejectWithValue }) => {
  try {
    await filesApi.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Delete failed');
  }
});

export const renameFile = createAsyncThunk('files/rename', async ({ id, name }, { rejectWithValue }) => {
  try {
    const res = await filesApi.rename(id, name);
    return res.data.data.file;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Rename failed');
  }
});

export const shareFile = createAsyncThunk('files/share', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await filesApi.share(id, data);
    return res.data.data.file;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Share failed');
  }
});

// ── Slice ─────────────────────────────────────────────────────────────

const filesSlice = createSlice({
  name: 'files',
  initialState: {
    items: [],
    pagination: null,
    loading: false,
    uploading: false,
    uploadProgress: 0,
    error: null,
    selectedFile: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setSelectedFile: (state, action) => { state.selectedFile = action.payload; },
    setUploadProgress: (state, action) => { state.uploadProgress = action.payload; },
    clearUploadProgress: (state) => { state.uploadProgress = 0; state.uploading = false; },
  },
  extraReducers: (builder) => {
    // Search
    builder
      .addCase(searchFiles.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(searchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.files;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Upload
    builder
      .addCase(uploadFile.pending, (state) => { state.uploading = true; state.error = null; })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.items = [action.payload, ...state.items];
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.uploading = false;
        state.uploadProgress = 0;
        state.error = action.payload;
      });

    // Delete
    builder.addCase(deleteFile.fulfilled, (state, action) => {
      state.items = state.items.filter((f) => f.id !== action.payload);
    });

    // Rename
    builder.addCase(renameFile.fulfilled, (state, action) => {
      const idx = state.items.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });

    // Share
    builder.addCase(shareFile.fulfilled, (state, action) => {
      const idx = state.items.findIndex((f) => f.id === action.payload.id);
      if (idx !== -1) state.items[idx] = action.payload;
    });
  },
});

export const { clearError, setSelectedFile, setUploadProgress, clearUploadProgress } = filesSlice.actions;
export default filesSlice.reducer;

export const selectFiles = (state) => state.files.items;
export const selectFilesLoading = (state) => state.files.loading;
export const selectUploading = (state) => state.files.uploading;
export const selectUploadProgress = (state) => state.files.uploadProgress;
export const selectFilesError = (state) => state.files.error;
export const selectPagination = (state) => state.files.pagination;
export const selectSelectedFile = (state) => state.files.selectedFile;

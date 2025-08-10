import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Field, FormSchema } from '../types';
import { v4 as uuid } from 'uuid';

interface State {
  workingForm: FormSchema | null;
  savedForms: FormSchema[];
}

const initialState: State = {
  workingForm: {
    id: uuid(),
    name: '',
    createdAt: new Date().toISOString(),
    fields: []
  },
  savedForms: JSON.parse(localStorage.getItem('forms') || '[]')
};

const slice = createSlice({
  name: 'formBuilder',
  initialState,
  reducers: {
    setWorkingForm(state, action: PayloadAction<FormSchema | null>) {
      if (action.payload) {
        state.workingForm = action.payload;;
      } else {
        state.workingForm = {
          id: uuid(),
          name: '',
          createdAt: new Date().toISOString(),
          fields: []
        };
      }

    },
    addField(state, action: PayloadAction<Field>) {
      state.workingForm?.fields.push(action.payload);
    },
    updateField(state, action: PayloadAction<Field>) {
      if (!state.workingForm) return;
      state.workingForm.fields = state.workingForm.fields.map(f => f.id === action.payload.id ? action.payload : f);
    },
    removeField(state, action: PayloadAction<string>) {
      if (!state.workingForm) return;
      state.workingForm.fields = state.workingForm.fields.filter(f => f.id !== action.payload);
    },
    reorderFields(state, action: PayloadAction<{ from: number, to: number }>) {
      const wf = state.workingForm;
      if (!wf) return;
      const { from, to } = action.payload;
      const [m] = wf.fields.splice(from, 1);
      wf.fields.splice(to, 0, m);
    },
    resetFields(state) {
      if (state.workingForm) {
        state.workingForm.fields = [];
      }
    },
    saveWorkingForm(state, action: PayloadAction<{ name: string }>) {
      if (!state.workingForm) return;
      state.workingForm.name = action.payload.name;
      state.workingForm.createdAt = new Date().toISOString();
      state.savedForms.push(state.workingForm);
      localStorage.setItem('forms', JSON.stringify(state.savedForms));
      // reset working form
      state.workingForm = {
        id: uuid(),
        name: 'Untitled Form',
        createdAt: new Date().toISOString(),
        fields: []
      };
    },
    loadFormToPreview(state, action: PayloadAction<string>) {
      const found = state.savedForms.find(s => s.id === action.payload);
      if (found) state.workingForm = JSON.parse(JSON.stringify(found));
    },
    deleteForm(state, action: PayloadAction<string>) {
      state.savedForms = state.savedForms.filter(f => f.id !== action.payload);
      localStorage.setItem('forms', JSON.stringify(state.savedForms));
    },
    updateFormName(state, action: PayloadAction<string>) {
      if (state.workingForm) {
        state.workingForm.name = action.payload;
      }
    }
  }
});

export const { setWorkingForm, addField, updateField, removeField, reorderFields, saveWorkingForm, loadFormToPreview, deleteForm, updateFormName, resetFields } = slice.actions;
export default slice.reducer;

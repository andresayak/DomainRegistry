import systemReducer from './systemReducer';
import { configureStore } from '@reduxjs/toolkit';

export default configureStore({
  reducer: {
    system: systemReducer,
  },
});

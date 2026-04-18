import { combineReducers } from "@reduxjs/toolkit";
import { userSlice, adminSlice } from "./userSlice";

const rootReducer = combineReducers({
    user: userSlice.reducer,
    admin: adminSlice.reducer,
});

export default rootReducer;
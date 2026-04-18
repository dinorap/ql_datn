import { configureStore } from "@reduxjs/toolkit";
import { userSlice, adminSlice } from "./slices/userSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

const userPersistConfig = {
    key: "user", storage,
    whitelist: ["account", "isAuthenticated", "cartCount"],
};

const adminPersistConfig = {
    key: "admin",
    storage,
    whitelist: ["account", "isAuthenticated"],
};

const persistedUserReducer = persistReducer(userPersistConfig, userSlice.reducer);
const persistedAdminReducer = persistReducer(adminPersistConfig, adminSlice.reducer);

const store = configureStore({
    reducer: {
        user: persistedUserReducer,
        admin: persistedAdminReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export const persistor = persistStore(store);
export default store;

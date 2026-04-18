import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    account: {
        id: "",
        username: "",
        email: "",
        role: "",
        avatar: "",
    },
    isAuthenticated: false,
    cartCount: 0,
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
            const { access_token, refresh_token, ...userInfo } = action.payload;
            state.account = userInfo;
            state.isAuthenticated = true;
            // Lưu token vào sessionStorage (tự động xóa khi đóng tab)
            sessionStorage.setItem('access_token', access_token);
            sessionStorage.setItem('refresh_token', refresh_token);
        },
        logout: (state) => {
            state.account = initialState.account;
            state.isAuthenticated = false;
            state.cartCount = 0;
            // Xóa token
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
        },
        updateAccount: (state, action) => {
            state.account = {
                ...state.account,
                ...action.payload
            };
        },
        setCartCount: (state, action) => {
            state.cartCount = action.payload;
        }
    },
});

export const adminSlice = createSlice({
    name: "admin",
    initialState,
    reducers: {
        aloginSuccess: (state, action) => {
            const { access_token, refresh_token, ...userInfo } = action.payload;
            state.account = userInfo;
            state.isAuthenticated = true;
            // Lưu token vào sessionStorage
            sessionStorage.setItem('access_token', access_token);
            sessionStorage.setItem('refresh_token', refresh_token);
        },
        alogout: (state) => {
            state.account = initialState.account;
            state.isAuthenticated = false;
            // Xóa token
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('refresh_token');
        },
        aupdateAccount: (state, action) => {
            if (state.account && state.account.id === action.payload.id) {
                state.account = {
                    ...state.account,
                    ...action.payload
                };
            }
        }
    },
});

export const { loginSuccess, logout, updateAccount, setCartCount } = userSlice.actions;
export const { aloginSuccess, alogout, aupdateAccount } = adminSlice.actions;
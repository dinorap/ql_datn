import axios from "axios";
import nProgress from "nprogress";
import { postRefeshToken, postLogOut } from "../services/apiService";
import { toast } from "react-toastify";

nProgress.configure({ showSpinner: false, trickleSpeed: 20 });

// Tạo Axios instance
const instance = axios.create({
    baseURL: process.env.REACT_APP_BASE_URL,
    withCredentials: true,
});

// Hàm lấy Access Token từ sessionStorage
const getAccessToken = () => {
    return sessionStorage.getItem('access_token');
};

// Hàm lấy Refresh Token từ sessionStorage
const getRefreshToken = () => {
    return sessionStorage.getItem('refresh_token');
};

// Thêm Access Token vào header của request
instance.interceptors.request.use(
    (config) => {
        const currentPath = window.location.pathname;

        // Chỉ bật nProgress ở trang /login
        if (currentPath === '/login') {
            nProgress.start();
        }

        const accessToken = getAccessToken();
        if (accessToken) {
            config.headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        nProgress.done();
        return Promise.reject(error);
    }
);

const LogOut = async () => {
    toast.error("Token đã hết hạn hãy đăng nhập lại");
    await postLogOut();
    sessionStorage.clear();
    delete instance.defaults.headers.common['Authorization'];
    window.location.href = '/login';
};

// Xử lý khi Access Token hết hạn
instance.interceptors.response.use(
    (response) => {
        const currentPath = window.location.pathname;

        // Chỉ dừng nProgress ở trang /login
        if (currentPath === '/login') {
            nProgress.done();
        }

        return response?.data || response;
    },
    async (error) => {
        nProgress.done();
        const originalRequest = error.config;

        // Kiểm tra lỗi 401 (token hết hạn)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = getRefreshToken();
                if (refreshToken) {
                    const response = await postRefeshToken();
                    const { EC, access_token, EM } = response || {};

                    if (EC === 0 && access_token) {
                        console.log("Làm mới Access Token thành công!");

                        // Cập nhật token mới vào sessionStorage
                        sessionStorage.setItem('access_token', access_token);

                        // Cập nhật header cho request hiện tại
                        originalRequest.headers["Authorization"] = `Bearer ${access_token}`;

                        return instance(originalRequest);
                    } else {
                        console.error("Lỗi làm mới token: ", EM || "Không có thông báo lỗi");
                        await LogOut();
                    }
                } else {
                    await LogOut();
                }
            } catch (refreshError) {
                console.error("Làm mới token thất bại", refreshError);
                await LogOut();
            }
        }

        // Xử lý lỗi 403
        if (error.response?.status === 403 && !originalRequest._retry) {
            await LogOut();
        }

        return Promise.reject(error);
    }
);

export default instance;

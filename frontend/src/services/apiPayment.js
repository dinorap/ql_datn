import axios from '../utils/axiosCustomize';

export const createVnpayPayment = (amount) => {
    return axios.post("/view/payment/vnpay", { amount });
};

export const createPaypalPayment = (amount) => {
    return axios.post("view/payment/paypal/create", { amount });
};

export const capturePaypalOrder = (token) => {
    return axios.post("view/payment/paypal/capture", { token });
};
import axios from '../utils/axiosCustomize';

const getAllOrders = (params) => {
    return axios.get(`api/order`, {
        params,
    });
};

const updateOrderStatus = (id, status_id) => {
    return axios.put(`/api/order/${id}`, { status_id });
};

const getAllOrdersPP = () => {
    return axios.get(`api/order`);
};

const createOrder = (orderData) => {
    return axios.post(`view/add_order`, orderData);
};

const sendOrder = (sendOrderData) => {
    return axios.post(`view/send_order`, sendOrderData);
};

const getUserOrderHistory = (userId, status, start_date, end_date) => {
    return axios.get(`/view/order/user/${userId}`, {
        params: {
            status,
            start_date,
            end_date
        }
    });
};


const cancelOrderById = (orderId) => {
    return axios.put(`/view/order/cancel/${orderId}`);
};


const getPurchasedProducts = (userId) => {
    return axios.get(`/view/purchase/${userId}`);
}

export {
    getAllOrders,
    updateOrderStatus,
    getAllOrdersPP,
    createOrder,
    sendOrder,
    getUserOrderHistory,
    cancelOrderById,
    getPurchasedProducts
};

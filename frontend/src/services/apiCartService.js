import axios from '../utils/axiosCustomize';

const addToCart = (data) => {
    return axios.post('/view/addcart', data);
};

const getCart = (id) => {
    return axios.get(`/view/cart/${id}`);
};

const getCartLocal = (items) => {
    return axios.post(`/view/cart/local`, { items });
};


const updateCartItem = (data) => {
    return axios.put('/view/updatecart', data);
};

const deleteCartItem = (id) => {
    return axios.delete(`/view/delcart/${id}`);
};

const getCartCount = (id) => {
    return axios.get(`/view/cartcount/${id}`);
};

const getAllStoreLocations = () => {
    return axios.get(`/view/store-locations`);
};

const getAllPayment = () => {
    return axios.get(`/view/payment`);
};
const mergeCartToServer = (user_id, items) => {
    return axios.post("/view/cart/merge", {
        user_id,
        items
    });
};

export { addToCart, getCart, updateCartItem, deleteCartItem, getCartCount, getAllStoreLocations, getAllPayment, getCartLocal, mergeCartToServer }
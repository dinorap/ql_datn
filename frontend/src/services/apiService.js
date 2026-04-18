import axios from '../utils/axiosCustomize';

const postLogin = (email, password) => {
    return axios.post(`api/login`, { email: email, password: password })
}

const postSignup = (email, username, password) => {
    return axios.post(`api/register`, { email: email, password: password, username: username })
}

const postForgotPassword = (email) => {
    return axios.post(`api/forgot-password`, { email });
};

const postResetPassword = (token, newPassword) => {
    return axios.post(`api/reset-password`, { token, newPassword });
};

const postLogOut = () => {
    return axios.post(`api/logout`, {}, { withCredentials: true });
};

const postRefeshToken = () => {
    return axios.post("api/refresh-token", {}, { withCredentials: true })
}

const postChatBot = (input) => {
    return axios.post("api/chatbot", { message: input })
}


export { postLogin, postSignup, postResetPassword, postForgotPassword, postLogOut, postRefeshToken, postChatBot }
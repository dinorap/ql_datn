import axios from '../utils/axiosCustomize';

const updateUserProfile = (formData) => {
    return axios.put('/api/user/profile', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const updateUserPassword = (data) => {
    return axios.put('/api/user/password', data);
};

export {
    updateUserProfile,
    updateUserPassword
}
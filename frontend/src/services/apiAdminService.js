import axios from '../utils/axiosCustomize';

const getAllUsers = () => {
    return axios.get(`api/admin/all`)
}

const getUserWithPaginate = (page, limit, search = '', searchType = 'username') => {
    return axios.get(`api/admin/paginate`, {
        params: {
            page: page,
            limit: limit,
            search: search,
            searchType: searchType
        }
    });
}

const postCreateNewUser = (email, password, username, role, avatar) => {
    const data = new FormData();
    data.append('email', email);
    data.append('password', password);
    data.append('username', username);
    data.append('role', role);
    data.append('avatar', avatar);

    return axios.post('api/admin/user', data);
}

const putUpdateUser = (id, email, username, role, avatar, removeAvatar) => {
    const data = new FormData();
    data.append('email', email);
    data.append('username', username);
    data.append('role', role);
    data.append("removeAvatar", removeAvatar);
    if (avatar) {
        data.append('avatar', avatar);
    }
    return axios.put(`api/admin/user/${id}`, data);
}

const delDeleteUser = (id) => {
    return axios.delete(`api/admin/user/${id}`)
}
const getUserById = (id) => {
    return axios.get(`api/admin/user/${id}`);
}

const putChangeLocker = (id, locker) => {
    return axios.put(`api/admin/user/locker/${id}`, { locker: locker })

}

const checkLowStock = () => {
    return axios.get(`api/products/low-stock`);
};
export {
    getAllUsers, getUserWithPaginate, postCreateNewUser, getUserById, putUpdateUser, delDeleteUser, putChangeLocker, checkLowStock
}
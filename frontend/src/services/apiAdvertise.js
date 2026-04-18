import axios from '../utils/axiosCustomize';


const getCompanies = () => {
    return axios.get(`api/companies`)
}

const getTypeCompanies = (type_id) => {
    return axios.get(`api/companies/${type_id}`)
}

const getAdvertise = (banner) => {
    return axios.get(`api/advertise/${banner}`)
}

const getAllAdvertise = () => {
    return axios.get(`api/advertise`)
}

const getAdvertiseWithPaginate = (page, limit, search = '', searchType = 'name', sortKey = 'id', sortDirection = 'desc') => {
    return axios.get(`api/advertises/paginate?page=${page}&limit=${limit}`, {
        params: {
            page: page,
            limit: limit,
            search: search,
            searchType: searchType,
            sortKey: sortKey,
            sortDirection: sortDirection
        },

    });
}

const deleteAdvertise = (id) => {
    return axios.delete(`api/advertise/${id}`)
}


const postCreateNewAdvertise = (name, link, image, banner) => {
    const data = new FormData();
    data.append('name', name);
    data.append('link', link);
    data.append('image', image);
    data.append('banner', banner);

    return axios.post('api/advertise', data);
}

const putUpdateAdvertise = (id, name, link, image, banner, removeAvatar) => {
    const data = new FormData();
    data.append('name', name);
    data.append('link', link);
    data.append('banner', banner);
    data.append("removeAvatar", removeAvatar);
    if (image) {
        data.append('image', image);
    }
    return axios.put(`api/advertise/${id}`, data);
}
export {
    getCompanies,
    getTypeCompanies,
    getAdvertise,
    getAdvertiseWithPaginate,
    getAllAdvertise,
    deleteAdvertise,
    postCreateNewAdvertise,
    putUpdateAdvertise
}
import axios from '../utils/axiosCustomize';

const getAllPromotionTypesWithPaginate = (page, limit, searchType, search) => {
    return axios.get(`api/promotion/paginate?`, {
        params: {
            page: page,
            limit: limit,
            search: search,
            searchType: searchType,
        }
    });
}
const postCreatePromotionType = (name, code, description, formula) => {
    return axios.post(`api/promotion`, {
        name,
        code,
        description,
        formula
    });
};
const putUpdatePromotionType = (id, name, code, description, formula) => {
    return axios.put(`api/promotion/${id}`, {
        name,
        code,
        description,
        formula
    });
};
const deletePromotionType = (id) => {
    return axios.delete(`api/promotion/${id}`
    );
};
const getAllPromotionType = () => {
    return axios.get(`api/promotion`)
}
export {
    getAllPromotionTypesWithPaginate,
    postCreatePromotionType,
    putUpdatePromotionType,
    deletePromotionType,
    getAllPromotionType
}


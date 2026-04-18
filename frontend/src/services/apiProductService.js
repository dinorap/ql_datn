import axios from '../utils/axiosCustomize';
const getAllProductsWithPaginate = (page, limit, searchType, search, category_id) => {
    return axios.get(`api/products/paginate`, {
        params: {
            page: page,
            limit: limit,
            searchType: searchType,
            search: search,
            category_id: category_id
        },

    });
};

const deleteProduct = (type, id) => {
    return axios.delete('/api/products', {
        params: { type, id }
    });
};

const buildFormData = (data) => {
    const formData = new FormData();

    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            if (
                key === 'primary_image' &&
                typeof value === 'string' &&
                value.startsWith('data:image')
            ) {
                const arr = value.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const file = new Blob([u8arr], { type: mime });
                formData.append(key, file, 'primary_image.png');
            } else if (typeof value === 'object') {
                formData.append(key, JSON.stringify(value));
            } else {
                formData.append(key, value);
            }
        }
    });

    return formData;
};


const createProduct = (data) => {
    return axios.post('/api/products', buildFormData(data));
};

const updateProduct = (id, data) => {
    return axios.put(`/api/product/${id}`, buildFormData(data));
};


const createVariant = (data) => {
    return axios.post('/api/variants', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

const updateVariant = (id, data) => {
    return axios.put(`/api/variants/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};


const createOption = (data) => {
    return axios.post('/api/options', data);
};
const updateOption = (id, data) => {
    return axios.put(`/api/options/${id}`, data);
};

const updateProductActiveStatus = (id, is_active) => {
    return axios.put(`api/products`, {
        id,
        is_active
    });
};

export {
    getAllProductsWithPaginate,
    deleteProduct,
    createProduct,
    updateProduct,
    createVariant,
    updateVariant,
    createOption,
    updateOption,
    updateProductActiveStatus
}


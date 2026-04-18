import axios from '../utils/axiosCustomize';


const getNews = (video) => {
    return axios.get(`api/news/${video}`)
}

const getAllNews = () => {
    return axios.get(`api/news`)
}

const getNewsWithPaginate = (page, limit, video, search = '', searchType = 'name', sortKey = 'id', sortDirection = 'desc') => {
    return axios.get(`api/newspage/paginate?`, {
        params: {
            page: page,
            limit: limit,
            video: video,
            search: search,
            searchType: searchType,
            sortKey: sortKey,
            sortDirection: sortDirection,

        },

    });
}

const deleteNews = (id) => {
    return axios.delete(`api/news/${id}`)
}


const postCreateNewNews = (name, link, image, video, linkvideo, author, description) => {
    const data = new FormData();
    data.append('name', name);
    data.append('link', link);
    data.append('image', image);
    data.append('video', video);
    data.append('author', author);
    data.append('description', description);
    if (linkvideo) {
        data.append('linkvideo', linkvideo);
    }

    return axios.post('api/news', data);
}

const putUpdateNews = (id, name, link, image, video, removeAvatar, linkvideo = null, author, description) => {
    const data = new FormData();
    data.append('name', name);
    data.append('link', link);
    data.append('video', video);
    data.append('linkvideo', linkvideo);
    data.append('author', author);
    data.append('description', description);
    data.append("removeAvatar", removeAvatar);
    if (image) {
        data.append('image', image);
    }
    return axios.put(`api/news/${id}`, data);
}
export {
    getNews,
    getNewsWithPaginate,
    getAllNews,
    deleteNews,
    postCreateNewNews,
    putUpdateNews
}
import axios from 'axios';

export const getVietnamAddressData = () => {
    return axios.get('https://raw.githubusercontent.com/dinorap/API_DiaGioiVn/main/data.json');
};
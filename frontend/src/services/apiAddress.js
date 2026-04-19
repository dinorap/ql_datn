import axios from "../utils/axiosCustomize";

export const getUserAddresses = async (user_id) =>
  axios.get(`/api/user-address/${user_id}`);

export const createAddress = async (data) => axios.post(`/api/user-address`, data);

export const updateAddress = async (id, data) =>
  axios.put(`/api/user-address/${id}`, data);

export const deleteAddress = async (id) => axios.delete(`/api/user-address/${id}`);

export const setDefaultAddress = async (id) =>
  axios.patch(`/api/user-address/${id}/default`);

export const getVietnamAddressData = async () => {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/dinorap/API_DiaGioiVn/main/data.json"
    );
    if (!res.ok) throw new Error("Không thể tải dữ liệu địa chỉ Việt Nam");
    return await res.json();
  } catch (error) {
    return [];
  }
};
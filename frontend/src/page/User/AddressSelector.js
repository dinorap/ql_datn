import React, { useEffect, useMemo, useState } from "react";
import {
  createAddress,
  deleteAddress,
  getUserAddresses,
  getVietnamAddressData,
  setDefaultAddress,
  updateAddress,
} from "../../services/apiAddress";
import { toast } from "react-toastify";

const emptyForm = {
  full_name: "",
  phone: "",
  city_id: "",
  city_name: "",
  district_id: "",
  district_name: "",
  ward_id: "",
  ward_name: "",
  detail_address: "",
  note: "",
  is_default: false,
};

const AddressSelector = ({
  userId,
  selectedAddressId,
  onSelectAddress,
  onAddressesLoaded,
}) => {
  const [addresses, setAddresses] = useState([]);
  const [cities, setCities] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const selectedCity = useMemo(
    () => cities.find((city) => city.Id === form.city_id),
    [cities, form.city_id]
  );
  const districts = selectedCity?.Districts || [];
  const selectedDistrict = districts.find((district) => district.Id === form.district_id);
  const wards = selectedDistrict?.Wards || [];

  const toArray = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res)) return res;
    return [];
  };

  const loadAddresses = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getUserAddresses(userId);
      const list = toArray(res);
      setAddresses(list);
      setShowForm(list.length === 0);
      onAddressesLoaded?.(list);
      if (!selectedAddressId && list.length > 0) {
        const defaultAddress = list.find((item) => item.is_default === 1) || list[0];
        onSelectAddress?.(defaultAddress.id);
      }
    } catch (error) {
      setAddresses([]);
      onAddressesLoaded?.([]);
      toast.error("Không tải được danh sách địa chỉ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCities = async () => {
      const data = await getVietnamAddressData();
      setCities(Array.isArray(data) ? data : []);
    };
    fetchCities();
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingAddress(null);
    setShowForm(addresses.length === 0);
  };

  const onChangeSelect = (field, value) => {
    if (field === "city_id") {
      const city = cities.find((item) => item.Id === value);
      setForm((prev) => ({
        ...prev,
        city_id: value,
        city_name: city?.Name || "",
        district_id: "",
        district_name: "",
        ward_id: "",
        ward_name: "",
      }));
      return;
    }
    if (field === "district_id") {
      const district = districts.find((item) => item.Id === value);
      setForm((prev) => ({
        ...prev,
        district_id: value,
        district_name: district?.Name || "",
        ward_id: "",
        ward_name: "",
      }));
      return;
    }
    if (field === "ward_id") {
      const ward = wards.find((item) => item.Id === value);
      setForm((prev) => ({ ...prev, ward_id: value, ward_name: ward?.Name || "" }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowForm(true);
    setForm({
      full_name: address.full_name || "",
      phone: address.phone || "",
      city_id: address.city_id || "",
      city_name: address.city_name || "",
      district_id: address.district_id || "",
      district_name: address.district_name || "",
      ward_id: address.ward_id || "",
      ward_name: address.ward_name || "",
      detail_address: address.detail_address || "",
      note: address.note || "",
      is_default: address.is_default === 1,
    });
  };

  const handleDelete = async (id) => {
    try {
      await deleteAddress(id);
      toast.success("Xóa địa chỉ thành công");
      if (selectedAddressId === id) {
        onSelectAddress?.(null);
      }
      await loadAddresses();
    } catch (error) {
      toast.error("Xóa địa chỉ thất bại");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      toast.success("Đã đặt địa chỉ mặc định");
      await loadAddresses();
    } catch (error) {
      toast.error("Không thể đặt địa chỉ mặc định");
    }
  };

  const validateForm = () => {
    if (!form.full_name.trim()) return "Vui lòng nhập họ tên";
    if (!/^0\d{9,10}$/.test(form.phone || "")) return "Số điện thoại chưa đúng định dạng";
    if (!form.city_id || !form.district_id || !form.ward_id) return "Vui lòng chọn đủ tỉnh/quận/phường";
    if (!form.detail_address.trim()) return "Vui lòng nhập địa chỉ cụ thể";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      toast.warning(err);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        user_id: userId,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
      };
      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
        toast.success("Cập nhật địa chỉ thành công");
      } else {
        await createAddress(payload);
        toast.success("Thêm địa chỉ thành công");
      }
      resetForm();
      await loadAddresses();
    } catch (error) {
      toast.error("Lưu địa chỉ thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="address-selector">
      <div className="address-header">
        <label className="note">Chọn địa chỉ giao hàng</label>
        {addresses.length > 0 && !showForm && (
          <button type="button" className="address-btn address-btn-primary" onClick={() => setShowForm(true)}>
            + Thêm địa chỉ mới
          </button>
        )}
      </div>
      <div className="address-list">
        {loading && <p>Đang tải địa chỉ...</p>}
        {!loading &&
          addresses.map((address) => (
            <label
              key={address.id}
              className={`address-card ${
                selectedAddressId === address.id ? "selected" : ""
              }`}
            >
              <input
                type="radio"
                name="selectedAddress"
                checked={selectedAddressId === address.id}
                onChange={() => onSelectAddress?.(address.id)}
              />
              <div className="address-card-content">
                <div className="address-card-top">
                  <b>{address.full_name}</b> - {address.phone}
                  {address.is_default === 1 && <span className="default-badge">Mặc định</span>}
                </div>
                <div>
                  {address.detail_address}, {address.ward_name}, {address.district_name},{" "}
                  {address.city_name}
                </div>
                {address.note && <div>Ghi chú: {address.note}</div>}
                <div className="address-actions">
                  <button type="button" onClick={() => handleEdit(address)}>
                    Sửa
                  </button>
                  <button type="button" onClick={() => handleDelete(address.id)}>
                    Xóa
                  </button>
                  {address.is_default !== 1 && (
                    <button type="button" onClick={() => handleSetDefault(address.id)}>
                      Đặt mặc định
                    </button>
                  )}
                </div>
              </div>
            </label>
          ))}
      </div>

      {showForm && (
      <form className="address-form" onSubmit={handleSubmit}>
        <p className="note">{editingAddress ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}</p>
        <div className="address-form-grid">
          <input
            type="text"
            placeholder="Họ và tên"
            value={form.full_name}
            onChange={(e) => onChangeSelect("full_name", e.target.value)}
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            value={form.phone}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                onChangeSelect("phone", e.target.value);
              }
            }}
          />
          <select value={form.city_id} onChange={(e) => onChangeSelect("city_id", e.target.value)}>
            <option value="">--Chọn Tỉnh/Thành phố--</option>
            {cities.map((city) => (
              <option key={city.Id} value={city.Id}>
                {city.Name}
              </option>
            ))}
          </select>
          <select
            value={form.district_id}
            onChange={(e) => onChangeSelect("district_id", e.target.value)}
            disabled={!form.city_id}
          >
            <option value="">--Chọn Huyện/Quận--</option>
            {districts.map((district) => (
              <option key={district.Id} value={district.Id}>
                {district.Name}
              </option>
            ))}
          </select>
          <select
            value={form.ward_id}
            onChange={(e) => onChangeSelect("ward_id", e.target.value)}
            disabled={!form.district_id}
          >
            <option value="">--Chọn Phường/Xã--</option>
            {wards.map((ward) => (
              <option key={ward.Id} value={ward.Id}>
                {ward.Name}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Địa chỉ cụ thể"
            value={form.detail_address}
            onChange={(e) => onChangeSelect("detail_address", e.target.value)}
          />
        </div>
        <textarea
          rows={2}
          placeholder="Ghi chú (tuỳ chọn)"
          value={form.note}
          onChange={(e) => onChangeSelect("note", e.target.value)}
        />
        <label className="default-checkbox">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => onChangeSelect("is_default", e.target.checked)}
          />
          Đặt làm địa chỉ mặc định
        </label>
        <div className="address-actions">
          <button type="submit" className="address-btn address-btn-primary" disabled={submitting}>
            {editingAddress ? "Cập nhật" : "Thêm địa chỉ"}
          </button>
          {editingAddress && (
            <button type="button" className="address-btn address-btn-secondary" onClick={resetForm}>
              Hủy
            </button>
          )}
          {!editingAddress && addresses.length > 0 && (
            <button type="button" className="address-btn address-btn-secondary" onClick={resetForm}>
              Đóng
            </button>
          )}
        </div>
      </form>
      )}
    </div>
  );
};

export default AddressSelector;

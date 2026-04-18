import React, { useState, useRef } from 'react';
import { useDispatch } from "react-redux";
import './UserProfile.scss';
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector } from 'react-redux';
import { FaEdit, FaCheck, FaLock } from "react-icons/fa";
import { toast } from 'react-toastify';
import { updateUserProfile, updateUserPassword } from '../../services/apiProfile';
import { updateAccount } from '../../redux/slices/userSlice';

const UserProfile = () => {
    const dispatch = useDispatch();
    const account = useSelector(state => state.user.account);

    const [formData, setFormData] = useState({
        username: account.username || '',
        email: account.email || '',
        phone: account.phone || '',
    });

    const [editState, setEditState] = useState({
        username: false,
        phone: false,
    });

    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const inputRefs = {
        username: useRef(null),
        phone: useRef(null),
    };

    const handleEditClick = (field) => {
        setEditState(prev => ({
            ...prev,
            [field]: true
        }));

        setTimeout(() => {
            inputRefs[field]?.current?.focus();
        }, 0);
    };

    const handleSaveClick = async (field) => {
        try {
            const res = await updateUserProfile({ [field]: formData[field] });
            if (res && res.EC === 0) {
                toast.success("Cập nhật thành công");

                dispatch(updateAccount({ [field]: formData[field] }));

                const userData = localStorage.getItem("persist:user");
                if (userData) {
                    const parsed = JSON.parse(userData);
                    const account = JSON.parse(parsed.account);
                    account[field] = formData[field];
                    parsed.account = JSON.stringify(account);
                    localStorage.setItem("persist:user", JSON.stringify(parsed));
                }

                setEditState(prev => ({
                    ...prev,
                    [field]: false
                }));
            } else {
                toast.error(res?.EM || "Có lỗi xảy ra");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi cập nhật");
        }
    };

    const handleChange = (e, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handlePasswordChange = (e) => {
        setPasswordData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Xác nhận mật khẩu không khớp!");
            return;
        }

        try {
            const res = await updateUserPassword(passwordData);
            if (res.EC === 0) {
                toast.success("Đổi mật khẩu thành công!");
                setShowPasswordForm(false);
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            } else {
                toast.error(res.EM || "Có lỗi khi đổi mật khẩu");
            }
        } catch (err) {
            toast.error("Lỗi server khi đổi mật khẩu");
            console.error(err);
        }
    };

    return (
        <div className="px-4 py-2">
            <div className="mb-4">
                <h5 className="mb-4">Thông tin cá nhân</h5>
                <div className="row g-3">

                    <div className="col-md-6 position-relative">
                        <label className="form-label">Tên tài khoản</label>
                        <input
                            ref={inputRefs.username}
                            type="text"
                            className="form-control pe-5"
                            value={formData.username}
                            onChange={(e) => handleChange(e, 'username')}
                            readOnly={!editState.username}
                        />
                        <span
                            className="position-absolute vitri end-0 translate-middle-y pe-3 text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                                editState.username
                                    ? handleSaveClick('username')
                                    : handleEditClick('username')
                            }
                        >
                            {editState.username ? <FaCheck /> : <FaEdit />}
                        </span>
                    </div>


                    <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" value={formData.email} readOnly />
                    </div>


                    <div className="col-md-6 position-relative">
                        <label className="form-label">Số điện thoại</label>
                        <input
                            ref={inputRefs.phone}
                            type="tel"
                            className="form-control pe-5"
                            value={formData.phone}
                            onChange={(e) => handleChange(e, 'phone')}
                            readOnly={!editState.phone}
                        />
                        <span
                            className="position-absolute vitri end-0 translate-middle-y pe-3 text-primary"
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                                editState.phone
                                    ? handleSaveClick('phone')
                                    : handleEditClick('phone')
                            }
                        >
                            {editState.phone ? <FaCheck /> : <FaEdit />}
                        </span>
                    </div>


                    <div className="col-6" style={{ marginTop: '55px', width: '223px' }}>
                        <label className="form-label">Mật khẩu:</label>
                        <span
                            style={{ cursor: 'pointer' }}
                            className="ms-2 text-primary fw-bold"
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                        >
                            <FaEdit className="me-2 vt" />
                            Đổi mật khẩu
                        </span>
                    </div>


                    {showPasswordForm && (
                        <div className="col-12">
                            <div className="row g-3">
                                <div className="col-md-4">
                                    <label className="form-label">Mật khẩu cũ:</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Mật khẩu mới:</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Xác nhận mật khẩu:</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className="form-control"
                                    />
                                </div>
                                <div className="col-md-12 d-flex justify-content-center mt-2">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleChangePassword}
                                    >
                                        Đồng ý
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

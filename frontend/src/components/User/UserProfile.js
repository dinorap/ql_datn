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
        <div className="user-profile-card">
            <div className="user-profile-card__header">
                <h5>Thông tin cá nhân</h5>
                <p>Quản lý thông tin để tài khoản của bạn bảo mật hơn.</p>
            </div>

            <div className="user-profile-grid">
                <div className="profile-field">
                    <label className="form-label">Tên tài khoản</label>
                    <div className="profile-input-wrap">
                        <input
                            ref={inputRefs.username}
                            type="text"
                            className="form-control"
                            value={formData.username}
                            onChange={(e) => handleChange(e, 'username')}
                            readOnly={!editState.username}
                        />
                        <button
                            type="button"
                            className="profile-icon-btn"
                            onClick={() =>
                                editState.username
                                    ? handleSaveClick('username')
                                    : handleEditClick('username')
                            }
                        >
                            {editState.username ? <FaCheck /> : <FaEdit />}
                        </button>
                    </div>
                </div>

                <div className="profile-field">
                    <label className="form-label">Email</label>
                    <div className="profile-input-wrap">
                        <input type="email" className="form-control" value={formData.email} readOnly />
                        <span className="profile-lock"><FaLock /></span>
                    </div>
                </div>

                <div className="profile-field">
                    <label className="form-label">Số điện thoại</label>
                    <div className="profile-input-wrap">
                        <input
                            ref={inputRefs.phone}
                            type="tel"
                            className="form-control"
                            value={formData.phone}
                            onChange={(e) => handleChange(e, 'phone')}
                            readOnly={!editState.phone}
                        />
                        <button
                            type="button"
                            className="profile-icon-btn"
                            onClick={() =>
                                editState.phone
                                    ? handleSaveClick('phone')
                                    : handleEditClick('phone')
                            }
                        >
                            {editState.phone ? <FaCheck /> : <FaEdit />}
                        </button>
                    </div>
                </div>

                <div className="profile-field profile-password-field">
                    <label className="form-label">Mật khẩu</label>
                    <button
                        type="button"
                        className="profile-password-btn"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                    >
                        <FaEdit /> Đổi mật khẩu
                    </button>
                </div>
            </div>

            {showPasswordForm && (
                <div className="password-panel">
                    <div className="user-profile-grid user-profile-grid--password">
                        <div className="profile-field">
                            <label className="form-label">Mật khẩu cũ</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="form-control"
                            />
                        </div>
                        <div className="profile-field">
                            <label className="form-label">Mật khẩu mới</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="form-control"
                            />
                        </div>
                        <div className="profile-field">
                            <label className="form-label">Xác nhận mật khẩu</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="form-control"
                            />
                        </div>
                    </div>
                    <div className="password-panel__action">
                        <button
                            className="btn profile-confirm-btn"
                            onClick={handleChangePassword}
                        >
                            Cập nhật mật khẩu
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;

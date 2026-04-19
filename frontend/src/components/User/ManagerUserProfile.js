import './UserProfile.scss';
import "bootstrap/dist/css/bootstrap.min.css";
import { useSelector, useDispatch } from 'react-redux';
import { FaCamera } from "react-icons/fa";
import defaultAvatar from '../../assets/Admin/avatar.png';
import { NavLink, useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useRef, useState } from 'react';
import { updateUserProfile } from '../../services/apiProfile';
import { toast } from 'react-toastify';
import { updateAccount } from '../../redux/slices/userSlice'
import { ImProfile } from "react-icons/im";
import { LuHistory } from "react-icons/lu";
import { IoMdNotifications } from "react-icons/io";

const ManagerUserProfile = () => {
    const dispatch = useDispatch();
    const account = useSelector(state => state.user.account);
    const location = useLocation();
    const isProfilePage = location.pathname === "/thongtin";

    const fileInputRef = useRef(null);
    const [previewAvatar, setPreviewAvatar] = useState(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("avatar", file);

            try {
                const res = await updateUserProfile(formData);
                if (res && res.EC === 0) {

                    const base64Avatar = await fileToBase64(file);
                    if (base64Avatar) {
                        dispatch(updateAccount({ avatar: base64Avatar }));
                    }
                    const updatedAvatar1 = URL.createObjectURL(file);

                    setPreviewAvatar(updatedAvatar1);

                    toast.success("Cập nhật ảnh đại diện thành công!");
                } else {
                    toast.error(res?.EM || "Cập nhật ảnh thất bại!");
                }
            } catch (error) {
                console.error(error);
                toast.error("Lỗi khi cập nhật ảnh!");
            }
        }
    };

    return (
        <div className="account-page">
            <div className="container-fluid account-container py-4">
                <div className="account-layout">
                    <aside className="account-sidebar">
                        <div className="account-sidebar__head">
                            <div className="account-avatar-wrap">
                                <img
                                    src={previewAvatar || account.avatar || defaultAvatar}
                                    className="account-avatar"
                                    alt="Profile"
                                />
                                {isProfilePage && (
                                    <>
                                        <button
                                            className="account-avatar-edit"
                                            onClick={handleAvatarClick}
                                            type="button"
                                        >
                                            <FaCamera />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            className="d-none"
                                            onChange={handleFileChange}
                                        />
                                    </>
                                )}
                            </div>
                            <h3 className="account-name">{account.username}</h3>
                            <p className="account-email">{account.email}</p>
                        </div>

                        <nav className="account-nav nav nav-pills">
                            <NavLink
                                className={({ isActive }) => "nav-link" + (isActive && location.pathname === "/thongtin" ? " active" : "")}
                                to="/thongtin"
                                end
                            >
                                <ImProfile className='mx-2 top' />Thông tin cá nhân
                            </NavLink>
                            <NavLink
                                className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
                                to="/thongtin/lichsu"
                            >
                                <LuHistory className='mx-2 top' />Lịch sử đơn hàng
                            </NavLink>
                            <NavLink className="nav-link" to="/thongbao">
                                <IoMdNotifications className='mx-2 top' />Thông báo
                            </NavLink>
                        </nav>
                    </aside>

                    <section className="account-content">
                        <Outlet />
                    </section>
                </div>
            </div>
        </div>
    );
};

export default ManagerUserProfile;

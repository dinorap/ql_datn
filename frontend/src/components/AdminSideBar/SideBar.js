import React, { useState } from 'react';
import {
    FaUsers,
    FaChartBar,
    FaBars,
    FaShoppingCart
} from 'react-icons/fa';
import { IoNewspaper } from "react-icons/io5";
import { RiAdvertisementFill } from "react-icons/ri";
import { AiFillProduct } from "react-icons/ai";
import { MdLogout } from "react-icons/md";
import './SideBar.scss';
import { useDispatch } from "react-redux";
import { alogout } from "../../redux/slices/userSlice";
import { postLogOut } from "../../services/apiService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import { FaStar } from "react-icons/fa";
import { HiSpeakerphone } from "react-icons/hi";
import defaultAvatar from '../../assets/Admin/avatar.png'; import { IoPhonePortrait } from "react-icons/io5";
import { MdLaptopMac } from "react-icons/md";
import { FaTabletScreenButton } from "react-icons/fa6";
import { GiUsbKey } from "react-icons/gi";
import { FaVideo } from "react-icons/fa";
import { GiWatch } from "react-icons/gi";
import { FaRegClock } from "react-icons/fa";
import { FaDesktop } from "react-icons/fa";
import { MdMiscellaneousServices } from "react-icons/md";
import { RiSmartphoneLine } from "react-icons/ri";

import { FaNewspaper } from "react-icons/fa6";


const SideBar = () => {
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const account = useSelector(state => state.admin.account);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [collapsed, setCollapsed] = useState(false);
    const [activeItem, setActiveItem] = useState('Dashboard');
    const [activeSubItem, setActiveSubItem] = useState('');
    const menuItems = [
        { icon: <FaChartBar />, label: 'Thống kê' },
        { icon: <FaUsers />, label: 'Khách hàng' },
        {
            icon: <AiFillProduct />,
            label: 'Sản phẩm',
            hasSubMenu: true,
            subItems: [
                { icon: <IoPhonePortrait />, label: 'Điện thoại' },
                { icon: <MdLaptopMac />, label: 'Laptop' },
                { icon: <FaTabletScreenButton />, label: 'Máy Tính Bảng' },
                { icon: <GiUsbKey />, label: 'Phụ kiện' },
                { icon: <GiWatch />, label: 'Smartwatch' },
                { icon: <FaRegClock />, label: 'Đồng hồ' },
                { icon: <RiSmartphoneLine />, label: 'Máy cũ, Thu cũ' },
                { icon: <FaDesktop />, label: 'PC, Máy in' },
                { icon: <MdMiscellaneousServices />, label: 'Dịch vụ' }
            ]
        },
        { icon: <FaShoppingCart />, label: 'Đơn hàng' },
        { icon: <FaStar />, label: 'Đánh giá' },
        { icon: <HiSpeakerphone />, label: 'Khuyến mại' },
        { icon: <RiAdvertisementFill />, label: 'Quảng cáo' },

        {
            icon: <IoNewspaper />, label: 'Tin tức',
            hasSubMenu: true,
            subItems: [
                { icon: <FaNewspaper />, label: 'Tin tức' },
                { icon: <FaVideo />, label: 'Video' },
            ]
        },
        { icon: <MdLogout />, label: 'Đăng xuất' }
    ];

    const roleMenuAccess = {
        admin: ['Thống kê', 'Khách hàng', 'Sản phẩm', 'Đơn hàng', 'Đánh giá', 'Khuyến mại', 'Quảng cáo', 'Tin tức', 'Đăng xuất'],
        staff: ['Khách hàng', 'Đơn hàng', 'Đánh giá', 'Đăng xuất'],
        product_manager: ['Sản phẩm', 'Đánh giá', 'Đăng xuất'],
        marketer: ['Khuyến mại', 'Quảng cáo', 'Đăng xuất'],
        editor: ['Tin tức', 'Đăng xuất']
    };

    const allowedLabels = roleMenuAccess[account?.role] || [];
    const filteredMenuItems = menuItems.filter(item => allowedLabels.includes(item.label));
    const HandleLogout = async () => {
        let data = await postLogOut();
        if (data && data.EC === 0) {
            toast.success(data.EM);
            dispatch(alogout());

            navigate("/");
        }
        else {
            toast.error(data.EM);
        }
    };
    const handleItemClick = (item, parentLabel = null) => {
        if (item.label === "Đăng xuất") {
            HandleLogout();

        }

        if (item.hasSubMenu) {
            setOpenSubMenu(openSubMenu === item.label ? null : item.label);
            setActiveItem(item.label);
            return;
        }

        if (parentLabel) {
            setActiveItem(parentLabel); setActiveSubItem(item.label);
        } else {
            setActiveItem(item.label);
            setActiveSubItem('');
        }

        const routeMap = {
            'Thống kê': ' ',
            'Khách hàng': 'khachhang',
            'Điện thoại': 'dienthoai',
            'Laptop': 'maytinh',
            'Máy Tính Bảng': 'maytinhbang',
            'Phụ kiện': 'sanpham/phukien',
            'Khuyến mại': 'khuyenmai',
            'Đánh giá': 'danhgia',
            'Quảng cáo': 'quangcao',
            'Đơn hàng': 'donhang',
            'Tin tức': 'tintuc',
            'Video': 'video'
        };

        if (routeMap[item.label]) {
            navigate(routeMap[item.label]);
        } else if (!item.hasSubMenu && item.label !== "Đăng xuất") {
            toast.info("Danh mục này đang được cập nhật.");
        }
    };



    const toggleSidebar = () => {
        setCollapsed(!collapsed);
    };


    return (
        <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="toggle-btn" onClick={toggleSidebar}>
                {collapsed ? <FaBars /> : <FaBars />}
            </div>


            {!collapsed ? (
                <div className="logo">
                    <h2>Thế giới công nghệ</h2>
                    <p>ADMIN management</p>
                </div>
            ) : (
                <div className="logo-close">

                </div>
            )
            }


            <div className="nav-menu">
                {filteredMenuItems.map((item) => (
                    <div key={item.label}>
                        <div
                            className={`nav-item ${activeItem === item.label ? 'active' : ''}`}
                            onClick={() => handleItemClick(item)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {!collapsed && <span className="nav-label">{item.label}</span>}
                            {item.hasSubMenu && !collapsed && (
                                <span className="submenu-arrow">
                                    {openSubMenu === item.label ? '▼' : '▶'}
                                </span>
                            )}
                        </div>

                        {item.hasSubMenu && openSubMenu === item.label && !collapsed && (
                            <div className="submenu">
                                {item.subItems.map((subItem) => (
                                    <div
                                        key={subItem.label}
                                        className={`submenu-item ${activeSubItem === subItem.label ? 'active' : ''}`}
                                        onClick={() => handleItemClick(subItem, item.label)}                                    >
                                        <span className="nav-icon">{subItem.icon}</span>
                                        {subItem.label}
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                ))}
            </div>

            <div className="user-profile">
                {!collapsed && (
                    <div className="profile-container" style={{ display: 'flex', alignItems: 'center' }}>

                        <div className="avatar-container" style={{ marginRight: '15px' }}>
                            <img
                                src={account.avatar ? `${process.env.REACT_APP_BASE_URL}${account.avatar}` : defaultAvatar}

                                alt="User Avatar"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>



                        <div className="profile-info">
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{account.username}</h4>
                            <p style={{ margin: '3px 0 0', fontSize: '14px', color: '#666' }}>{account.email}</p>
                            <p style={{
                                margin: '3px 0 0',
                                fontSize: '12px',
                                color: '#888',
                                textTransform: 'capitalize'
                            }}>{account.role}</p>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

export default SideBar;
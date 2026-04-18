import './Others.scss'
import React, { useState } from "react";
import ManagerUsers from '../../../components/AdminSideBar/Customer/ManagerUsers';
const KhachHang = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center", marginBottom: "25px" }}><b>QUẢN LÝ KHÁCH HÀNG</b></h1>
            <ManagerUsers />
        </div>
    )
}

export default KhachHang
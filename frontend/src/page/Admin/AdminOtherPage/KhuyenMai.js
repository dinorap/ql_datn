import './Others.scss'
import React, { useState } from "react";
import ManagerPromotion from '../../../components/AdminSideBar/Promotion/ManagerPromotion';
const KhuyenMai = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center", marginBottom: "25px" }}><b>QUẢN LÝ CHƯƠNG TRÌNH KHUYẾN MẠI</b></h1>
            <ManagerPromotion />
        </div>
    )
}

export default KhuyenMai
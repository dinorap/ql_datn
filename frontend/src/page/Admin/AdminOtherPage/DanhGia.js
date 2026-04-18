
import ManagerReview from '../../../components/AdminSideBar/Review/ManagerReview';
import './Others.scss'
import React, { useState } from "react";
const DanhGia = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center", marginBottom: "25px" }}><b>QUẢN LÝ ĐÁNH GIÁ VÀ PHẢN HỒI SẢN PHẨM</b></h1>
            <ManagerReview />
        </div>
    )
}

export default DanhGia
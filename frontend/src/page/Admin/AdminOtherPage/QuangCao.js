import ManagerAdvertise from '../../../components/AdminSideBar/Advertise/ManagerAdvertise';
import './Others.scss'
import React, { useState } from "react";
const QuangCao = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center", marginBottom: "25px" }}><b>QUẢN LÝ BANNER QUẢNG CÁO</b></h1>
            <ManagerAdvertise />
        </div>
    )
}

export default QuangCao
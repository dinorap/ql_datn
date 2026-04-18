import './Others.scss'
import React, { useState } from "react";
import ManagerNews from '../../../components/AdminSideBar/News/New/ManagerNews'
const ATinTuc = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center", marginBottom: "25px" }}><b>QUẢN LÝ TIN TỨC</b></h1>
            <ManagerNews />
        </div>
    )
}

export default ATinTuc
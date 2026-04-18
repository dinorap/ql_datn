import OrderTable from '../../../components/AdminSideBar/Order/TableOrder';
import './Others.scss'
import React, { useState } from "react";
const DonHang = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center", marginBottom: "25px" }}><b>QUẢN LÝ ĐƠN ĐẶT HÀNG</b></h1>
            <OrderTable />
        </div>
    )
}

export default DonHang
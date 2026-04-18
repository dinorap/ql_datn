import '../Others.scss'
import React from "react";
import ManagerProducts from '../../../../components/AdminSideBar/Product/ManagerProducts';
const DienThoai = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center" }}><b>Điện thoại</b></h1>
            <ManagerProducts category_id={1} />
        </div>
    )
}

export default DienThoai
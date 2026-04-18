import '../Others.scss'
import React from "react";
import ManagerProducts from '../../../../components/AdminSideBar/Product/ManagerProducts';
const MayTinhBang = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center" }}><b>Máy tính bảng</b></h1>
            <ManagerProducts category_id={3} />
        </div>
    )
}

export default MayTinhBang
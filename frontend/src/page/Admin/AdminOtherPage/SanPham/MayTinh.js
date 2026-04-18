import '../Others.scss'
import React from "react";
import ManagerProducts from '../../../../components/AdminSideBar/Product/ManagerProducts';
const MayTinh = () => {
    return (
        <div>
            <h1 style={{ textAlign: "center" }}><b>Máy Tính</b></h1>
            <ManagerProducts category_id={2} />
        </div>
    )
}

export default MayTinh
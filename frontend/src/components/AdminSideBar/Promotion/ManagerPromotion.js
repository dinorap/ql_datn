import { useState, useEffect } from "react";

import ModaDeletePromotion from "./ModaDeletePromotion";
import ModalUpdatePromotion from "./ModalUpdatePromotion";
import ModalCreatePromotion from "./ModalCreatePromotion";
import { getAllPromotionTypesWithPaginate } from "../../../services/apiPromotionService";
import TablePromotion from "./TablePromotion";
const LIMIT = 10
const ManagerPromotion = () => {
    useEffect(() => {
        fetchListWithPaginate(1);
        setCurrentPage(1)
    }, [])
    const [rowCount, setRowCount] = useState(0)
    const [pageCount, setPageCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [list, setList] = useState([])
    const [dataUpdate, setDataUpdate] = useState({})
    const [dataDelete, setDataDelete] = useState({})
    const [showModalCreate, setShowModalCreate] = useState(false)
    const [showModalUpdate, setShowModalUpdate] = useState(false)
    const [showModalDel, setShowModalDel] = useState(false)
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('');
    const fetchListWithPaginate = async (page, searchType, searchTerm) => {
        let res = await getAllPromotionTypesWithPaginate(page, LIMIT, searchType, searchTerm)
        if (res.EC === 0) {
            setList(res.data.promotion_types)
            setPageCount(res.data.totalPage)
            setRowCount(res.data.totalRow)
        }
    }
    const handleUpdate = (news, searchType, searchTerm) => {
        setShowModalUpdate(true)
        setDataUpdate(news)
        setSearchType(searchType)
        setSearchTerm(searchTerm)

    }
    const resetUpdateData = () => {
        setDataUpdate("")
    }
    const handleDelete = (news, searchType, searchTerm) => {
        setShowModalDel(true)
        setDataDelete(news)
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    }
    return (
        <>
            <TablePromotion
                list={list}
                fetchListWithPaginate={fetchListWithPaginate}
                setCurrentPage={setCurrentPage}
                setShowModalCreate={setShowModalCreate}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                pageCount={pageCount}
                rowCount={rowCount}
                currentPage={currentPage}
            />
            <ModalCreatePromotion
                show={showModalCreate}
                setShow={setShowModalCreate}

                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModalUpdatePromotion
                show={showModalUpdate}
                setShow={setShowModalUpdate}
                dataUpdate={dataUpdate}
                searchType={searchType}
                searchTerm={searchTerm}
                resetUpdateData={resetUpdateData}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModaDeletePromotion
                show={showModalDel}
                setShow={setShowModalDel}
                dataDelete={dataDelete}
                searchType={searchType}
                searchTerm={searchTerm}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
        </>
    )
}
export default ManagerPromotion;
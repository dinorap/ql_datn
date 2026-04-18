import { useState, useEffect } from "react";
import ModalReplyReview from "./ModalReplyReview";
import ModalUpdateReply from "./ModalUpdateReply";
import ModalDeleteReview from "./ModalDeleteReview";
import TableReview from "./TableReview";
import { getAllReviewsWithPaginate } from "../../../services/apiReviewService";
import ModalDeleteReply from "./ModalDeleteReply";
const LIMIT = 10
const ManagerReview = () => {
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
    const [dataCreate, setDataCreate] = useState({})
    const [dataDeleteReply, setDataDeleteReply] = useState({})
    const [showModalCreate, setShowModalCreate] = useState(false)
    const [showModalUpdate, setShowModalUpdate] = useState(false)
    const [showModalDel, setShowModalDel] = useState(false)
    const [showModalDelReply, setShowModalDelReply] = useState(false)

    const fetchListWithPaginate = async (page, searchType, searchTerm) => {
        let res = await getAllReviewsWithPaginate(page, LIMIT, searchType, searchTerm)
        if (res.EC === 0) {
            setList(res.data.reviews)
            setPageCount(res.data.totalPage)
            setRowCount(res.data.totalRow)
        }
    }
    const handleReplyReview = (review) => {
        setShowModalCreate(true)
        setDataCreate(review)
    }
    const handleUpdate = (news) => {
        setShowModalUpdate(true)
        setDataUpdate(news)

    }
    const resetUpdateData = () => {
        setDataUpdate("")
    }
    const handleDelete = (news) => {
        setShowModalDel(true)
        setDataDelete(news)
    }
    const handleDeleteReply = (news) => {
        setShowModalDelReply(true)
        setDataDeleteReply(news)
    }
    return (
        <>
            <TableReview
                list={list}
                fetchListWithPaginate={fetchListWithPaginate}
                setCurrentPage={setCurrentPage}
                handleReplyReview={handleReplyReview}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                handleDeleteReply={handleDeleteReply}
                pageCount={pageCount}
                rowCount={rowCount}
                currentPage={currentPage}
            />
            <ModalReplyReview
                show={showModalCreate}
                dataCreate={dataCreate}
                setShow={setShowModalCreate}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModalUpdateReply
                show={showModalUpdate}
                setShow={setShowModalUpdate}
                dataEdit={dataUpdate}
                resetUpdateData={resetUpdateData}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModalDeleteReview
                show={showModalDel}
                setShow={setShowModalDel}
                dataDelete={dataDelete}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModalDeleteReply
                show={showModalDelReply}
                setShow={setShowModalDelReply}
                dataDelete={dataDeleteReply}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
        </>
    )
}
export default ManagerReview;
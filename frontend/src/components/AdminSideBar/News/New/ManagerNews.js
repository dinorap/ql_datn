import { useState, useEffect } from "react";
import TableNews from "./TableNews";
import ModalUpdateNews from "./ModalUpdateNews";
import ModalDeleteNews from "./ModalDeleteNews";
import ModalCreateNews from "./ModalCreateNews";
import { getAllNews, getNewsWithPaginate } from "../../../../services/apiNewsService";
const LIMIT = 5
const ManagerNews = () => {
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
    const fetchList = async () => {
        let res = await getAllNews()
        if (res.EC === 0) {
            setList(res.data)
        }
    }
    const fetchListWithPaginate = async (page, searchType, searchTerm) => {
        let res = await getNewsWithPaginate(page, LIMIT, 0, searchType, searchTerm)
        if (res.EC === 0) {
            setList(res.data.news)
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
            <TableNews
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
            <ModalCreateNews
                show={showModalCreate}
                setShow={setShowModalCreate}
                fetchList={fetchList}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModalUpdateNews
                show={showModalUpdate}
                setShow={setShowModalUpdate}
                dataUpdate={dataUpdate}
                fetchList={fetchList}
                resetUpdateData={resetUpdateData}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                searchType={searchType}
                searchTerm={searchTerm}
            />
            <ModalDeleteNews
                show={showModalDel}
                setShow={setShowModalDel}
                dataDelete={dataDelete}
                fetchList={fetchList}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                searchType={searchType}
                searchTerm={searchTerm}
            />
        </>
    )
}
export default ManagerNews;
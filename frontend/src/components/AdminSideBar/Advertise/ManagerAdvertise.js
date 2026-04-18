import { useState, useEffect } from "react";
import TableAdvertise from "./TableAdvertise";
import { getAdvertiseWithPaginate, getAllAdvertise } from "../../../services/apiAdvertise";
import ModalCreateAdvertise from "./ModalCreatAdvertise";
import ModalUpdateAdvertise from "./ModalUpdateAdvertise";
import ModalDeleteAdvertise from "./ModalDeleteAdvertise";

const LIMIT = 6
const ManagerAdvertise = () => {
    useEffect(() => {
        fetchListWithPaginate(1);
        setCurrentPage(1)
    }, [])

    const [pageCount, setPageCount] = useState(0)
    const [rowCount, setRowCount] = useState(0)
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
        let res = await getAllAdvertise()
        if (res.EC === 0) {
            setList(res.data)
        }
    }
    const fetchListWithPaginate = async (page, searchType, searchTerm) => {
        let res = await getAdvertiseWithPaginate(page, LIMIT, searchType, searchTerm)
        if (res.EC === 0) {
            setList(res.data.advertise)
            setPageCount(res.data.totalPage)
            setRowCount(res.data.totalRow)
        }
    }
    const handleUpdate = (advertise, searchType, searchTerm) => {
        setShowModalUpdate(true)
        setDataUpdate(advertise)
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    }
    const resetUpdateData = () => {
        setDataUpdate("")
    }
    const handleDelete = (advertise, searchType, searchTerm) => {
        setShowModalDel(true)
        setDataDelete(advertise)
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    }
    return (
        <>
            <TableAdvertise
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
            <ModalCreateAdvertise
                show={showModalCreate}
                setShow={setShowModalCreate}
                fetchList={fetchList}
                fetchListWithPaginate={fetchListWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModalUpdateAdvertise
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
            <ModalDeleteAdvertise
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
export default ManagerAdvertise;
import { getAllUsers } from '../../../services/apiAdminService';
import TableUsers from './TableUsers';
import ModalViewUser from './ModalViewUser';
import { getUserWithPaginate } from '../../../services/apiAdminService';
import { useState, useEffect } from "react";
import ModalCreatUser from './ModalCreateUser';
import ModalUpdate from './ModalUpdate';
import ModalDeleteUser from './ModalDeleteUser';
const LIMIT_USER = 9
const ManagerUsers = () => {
    useEffect(() => {
        fetchListUsers()
        fetchListUsersWithPaginate(1);
        setCurrentPage(1)
    }, [])
    const [allListUsers, setAllListUsers] = useState([])
    const [pageCount, setPageCount] = useState(0)
    const [rowCount, setRowCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(0)
    const [listUsers, setListUsers] = useState([])
    const [dataView, setDataView] = useState({})
    const [dataUpdate, setDataUpdate] = useState({})
    const [dataDelete, setDataDelete] = useState({})
    const [showModalCreateUser, setShowModalCreateUser] = useState(false)
    const [showModalUpdateUser, setShowModalUpdateUser] = useState(false)
    const [showModalViewUser, setShowModalViewUser] = useState(false)
    const [showModalDelUser, setShowModalDelUser] = useState(false)
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('username');
    const fetchListUsers = async () => {
        let res = await getAllUsers()
        if (res.EC === 0) {
            setAllListUsers(res.data)
        }
    }
    const fetchListUsersWithPaginate = async (page, searchType, searchTerm, key, direction) => {
        let res = await getUserWithPaginate(page, LIMIT_USER, searchType, searchTerm, key, direction)
        if (res.EC === 0) {
            setListUsers(res.data.users)
            setPageCount(res.data.totalPage)
            setRowCount(res.data.totalRow)
        }
    }
    const handleUpdateUser = (user, searchType, searchTerm) => {
        setShowModalUpdateUser(true)
        setDataUpdate(user)
        setSearchType(searchType)
        setSearchTerm(searchTerm)

    }
    const resetUpdateData = () => {
        setDataUpdate("")
    }
    const resetViewData = () => {
        setDataView("")
    }
    const handleViewUser = (user) => {
        setShowModalViewUser(true)
        setDataView(user)
    }
    const handleDeleteUser = (user, searchType, searchTerm) => {
        setShowModalDelUser(true)
        setDataDelete(user)
        setSearchType(searchType)
        setSearchTerm(searchTerm)
    }
    return (
        <>
            <>
                <TableUsers
                    setShowModalCreateUser={setShowModalCreateUser}
                    listUsers={listUsers}
                    allListUsers={allListUsers}
                    handleUpdateUser={handleUpdateUser}
                    handleViewUser={handleViewUser}
                    handleDeleteUser={handleDeleteUser}
                    fetchListUsersWithPaginate={fetchListUsersWithPaginate}
                    pageCount={pageCount}
                    rowCount={rowCount}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                ></TableUsers>
            </>
            <ModalCreatUser
                show={showModalCreateUser}
                setShow={setShowModalCreateUser}
                fetchListUsers={fetchListUsers}
                fetchListUsersWithPaginate={fetchListUsersWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <ModalViewUser
                show={showModalViewUser}
                setShow={setShowModalViewUser}
                dataView={dataView}
                resetUpdateData={resetUpdateData}
                fetchListUsersWithPaginate={fetchListUsersWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                resetViewData={resetViewData}
            />
            <ModalUpdate
                show={showModalUpdateUser}
                setShow={setShowModalUpdateUser}
                dataUpdate={dataUpdate}
                fetchListUsers={fetchListUsers}
                resetUpdateData={resetUpdateData}
                fetchListUsersWithPaginate={fetchListUsersWithPaginate}
                currentPage={currentPage}
                searchType={searchType}
                searchTerm={searchTerm}
                setCurrentPage={setCurrentPage}
            />
            <ModalDeleteUser
                show={showModalDelUser}
                setShow={setShowModalDelUser}
                dataDelete={dataDelete}
                fetchListUsers={fetchListUsers}
                fetchListUsersWithPaginate={fetchListUsersWithPaginate}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                searchType={searchType}
                searchTerm={searchTerm}
            />
        </>
    )
}

export default ManagerUsers;
import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Space, Tag, Switch, Pagination, Modal } from 'antd';
import { FcPlus } from 'react-icons/fc';
import { putChangeLocker } from '../../../services/apiAdminService';
import { toast } from 'react-toastify';
import { CSVLink } from "react-csv";
import './Customer.scss';

const { Option } = Select;

const TableUsers = (props) => {
    const csvHeaders = [
        { label: "ID", key: "id" },
        { label: "Username", key: "username" },
        { label: "Email", key: "email" },
        { label: "Role", key: "role" },
        { label: "Locker", key: "locker" },
    ];

    const { listUsers, pageCount, currentPage, allListUsers, rowCount } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('username');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const [showConfirmLockerModal, setShowConfirmLockerModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        props.fetchListUsersWithPaginate(currentPage, searchTerm, searchType);
    }, [searchTerm, searchType]);

    const handleConfirmLockerChange = async () => {
        if (!selectedUser) return;
        const newLockerValue = selectedUser.locker === 1 ? 0 : 1;

        const data = await putChangeLocker(selectedUser.id, newLockerValue);
        if (data?.EC === 0) {
            toast.success(data.EM);
            props.fetchListUsersWithPaginate(currentPage, searchTerm, searchType);
        } else {
            toast.error(data?.EM || "Có lỗi xảy ra");
        }
        setShowConfirmLockerModal(false);
        setSelectedUser(null);
    };

    const handleClickLocker = (user) => {
        setSelectedUser(user);
        setShowConfirmLockerModal(true);
    };

    const sortedList = [...listUsers].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        return sortConfig.direction === 'asc' ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1);
    });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const columns = [
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('id')}>ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'id',
            key: 'id',
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('username')}>Username {sortConfig.key === 'username' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'username',
            key: 'username'
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('email')}>Email {sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'email',
            key: 'email'
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('role')}>Quyền {sortConfig.key === 'role' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                let color = 'default';

                switch (role) {
                    case 'admin':
                        color = 'green';
                        break;
                    case 'staff':
                        color = '#d70018';
                        break;
                    case 'product_manager':
                        color = 'orange';
                        break;
                    case 'marketer':
                        color = 'magenta';
                        break;
                    case 'editor':
                        color = 'purple';
                        break;
                    default:
                        color = 'default';
                }

                return <Tag color={color}>{role}</Tag>;
            }
        },
        {
            className: 'first',
            title: 'Hoạt động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <button className="btn btn-info" onClick={() => props.handleViewUser(record)}>Xem</button>
                    <button className="btn btn-warning mx-2" onClick={() => props.handleUpdateUser(record, searchTerm, searchType)}>Cập nhật</button>
                    <button className="btn btn-danger" onClick={() => props.handleDeleteUser(record, searchTerm, searchType)}>Xóa</button>
                </Space>
            )
        },
        {
            className: 'first',
            title: 'Trạng thái',
            key: 'locker',
            render: (_, record) => (
                <Space>
                    <Switch
                        checked={record.locker === 0}
                        onChange={() => handleClickLocker(record)}
                    />
                    <span>{record.locker === 1 ? "Đã khóa" : "Hoạt động"}</span>
                </Space>
            )
        }
    ];

    const handleAntdPageChange = (page) => {
        props.fetchListUsersWithPaginate(page, searchTerm, searchType);
        props.setCurrentPage(page);
    };

    return (
        <div>
            <Modal
                className='ok'
                title="Xác nhận thay đổi trạng thái"
                open={showConfirmLockerModal}
                onCancel={() => setShowConfirmLockerModal(false)}
                onOk={handleConfirmLockerChange}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <p>
                    Bạn có chắc muốn {selectedUser?.locker === 1 ? "mở khóa" : "khóa"} người dùng{" "}
                    <b>{selectedUser?.username}</b>?
                </p>
            </Modal>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <Space className=''>
                    <Button type="primary" className='success' icon={<FcPlus />} onClick={() => props.setShowModalCreateUser(true)}>
                        Thêm người dùng mới
                    </Button>

                    <CSVLink headers={csvHeaders} data={allListUsers} filename="all_users.csv" className="btn btn-success">
                        Xuất tất cả CSV
                    </CSVLink>
                    <CSVLink headers={csvHeaders} data={listUsers} filename="users.csv" className="btn btn-success">
                        Xuất CSV
                    </CSVLink>
                </Space>

                <Space>
                    <Select value={searchType} onChange={setSearchType} style={{ width: 120 }}>
                        <Option value="username">Username</Option>
                        <Option value="email">Email</Option>
                        <Option value="role">Quyền</Option>
                        <Option value="locker">Trạng thái</Option>
                    </Select>

                    {searchType === 'locker' ? (
                        <Select
                            value={searchTerm || undefined}
                            onChange={(val) => {
                                setSearchTerm(val);
                                props.setCurrentPage(1);
                            }}
                            style={{ width: 250 }}
                            allowClear
                            placeholder="Chọn trạng thái"
                        >
                            <Option value="0">Hoạt động</Option>
                            <Option value="1">Đã khóa</Option>
                        </Select>
                    ) : (
                        <Input
                            type="text"
                            style={{ width: 250 }}
                            placeholder={`Tìm kiếm theo ${searchType === 'username' ? 'tên người dùng' :
                                searchType === 'email' ? 'email' : 'quyền'
                                }...`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                props.setCurrentPage(1);
                            }}
                            allowClear
                        />
                    )}
                </Space>

            </div>

            <Table
                dataSource={sortedList.map(item => ({ ...item, key: item.id }))}
                columns={columns}
                pagination={false}
                bordered
            />

            <div className="d-flex justify-content-center mt-3">
                <Pagination
                    current={currentPage}
                    total={rowCount}
                    pageSize={9}
                    showSizeChanger={false}
                    onChange={handleAntdPageChange}
                />
            </div>
        </div>
    );
};

export default TableUsers;

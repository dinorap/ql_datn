import { useState, useEffect } from "react";
import { Table, Button, Input, Select, Space, Pagination } from 'antd';
import { FcPlus } from 'react-icons/fc';
import './Video.scss';

const { Option } = Select;

const TableVideo = (props) => {
    const { list, pageCount, currentPage, rowCount } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        props.fetchListWithPaginate(currentPage, searchTerm, searchType);
    }, [searchTerm, searchType]);

    const sortedList = [...list].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
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
            key: 'id'
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('name')}>Tên {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'name',
            key: 'name'
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('link')}>Link {sortConfig.key === 'link' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'link',
            key: 'link',
            render: (text) => <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('linkvideo')}>Link Video {sortConfig.key === 'linkvideo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'linkvideo',
            key: 'linkvideo',
            render: (text) => <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('author')}>Tác giả {sortConfig.key === 'author' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'author',
            key: 'author'
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('description')}>Mô tả {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'description',
            key: 'description',
            render: (description) => <p className="twice" >{description}</p>
        },
        {
            className: 'first crud_video',
            title: 'Hoạt động',
            key: 'action',
            render: (text, record) => (
                <Space>
                    <button className="btn btn-warning mx-3" onClick={() => props.handleUpdate(record, searchType, searchTerm)}>Cập nhật</button>
                    <button className="btn btn-danger" onClick={() => props.handleDelete(record, searchType, searchTerm)}>Xóa</button>
                </Space>
            )
        }
    ];

    const handleAntdPageChange = (page) => {
        props.fetchListWithPaginate(page, searchTerm, searchType);
        props.setCurrentPage(page);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button className="success" type="primary" icon={<FcPlus />} onClick={() => props.setShowModalCreate(true)}>
                    Thêm video tin tức mới
                </Button>

                <Space>
                    <Select value={searchType} onChange={setSearchType} style={{ width: '100px' }}>
                        <Option value="name">Tên</Option>
                    </Select>
                    <Input
                        style={{ width: '250px' }}
                        placeholder={`Tìm kiếm theo tên video tin tức...`}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            props.setCurrentPage(1);
                        }}
                        allowClear
                    />
                </Space>
            </div>

            <Table
                dataSource={sortedList.map(item => ({ ...item, key: item.id }))}
                columns={columns}
                pagination={false}
                locale={{ emptyText: searchTerm ? "Không tìm thấy kết quả phù hợp" : "Không có dữ liệu" }}
                bordered
            />

            <div className="d-flex justify-content-center mt-3">
                <Pagination
                    current={currentPage}
                    total={rowCount}
                    pageSize={6}
                    showSizeChanger={false}
                    onChange={handleAntdPageChange}
                />
            </div>
        </div>
    );
};

export default TableVideo;
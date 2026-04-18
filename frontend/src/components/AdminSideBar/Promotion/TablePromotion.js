import { useState, useEffect } from "react";
import Table from 'antd/es/table';
import 'antd/es/table/style';

import Input from 'antd/es/input';
import 'antd/es/input/style';

import Select from 'antd/es/select';
import 'antd/es/select/style';

import Space from 'antd/es/space';
import 'antd/es/space/style';

import Pagination from 'antd/es/pagination';
import 'antd/es/pagination/style';

import Tag from 'antd/es/tag';
import 'antd/es/tag/style';

import Button from 'antd/es/button';
import 'antd/es/button/style';

import { FcPlus } from "react-icons/fc";

const { Option } = Select;

const TablePromotion = (props) => {
    const { list, currentPage, rowCount } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    useEffect(() => {
        props.fetchListWithPaginate(currentPage, searchType, searchTerm);
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

    const handleAntdPageChange = (page) => {
        props.fetchListWithPaginate(page, searchType, searchTerm);
        props.setCurrentPage(page);
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
            title: () => <span onClick={() => requestSort('description')}>Mô tả {sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'description',
            key: 'description'
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('code')}>Mã {sortConfig.key === 'code' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'code',
            key: 'code',
            render: (code) => <Tag color="blue">{code}</Tag>
        },
        {
            className: 'first',
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

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button className="success" type="primary" icon={<FcPlus />} onClick={() => props.setShowModalCreate(true)}>
                    Thêm loại khuyến mãi
                </Button>

                <Space>
                    <Select value={searchType} onChange={setSearchType} style={{ width: '100px' }}>
                        <Option value="name">Tên</Option>
                        <Option value="code">Mã</Option>
                    </Select>
                    <Input
                        style={{ width: '250px' }}
                        placeholder={`Tìm kiếm theo ${searchType === 'name' ? 'tên' : 'mã'}...`}
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
                bordered
                locale={{ emptyText: searchTerm ? "Không tìm thấy kết quả phù hợp" : "Không có dữ liệu" }}
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

export default TablePromotion;

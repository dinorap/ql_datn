import { useState, useEffect } from "react";
import "./Advertise.scss";
import { FcPlus } from 'react-icons/fc';
import Table from 'antd/es/table';
import 'antd/es/table/style';
import Tag from 'antd/es/tag';
import 'antd/es/tag/style';
import Image from 'antd/es/image';
import 'antd/es/image/style';
import Button from 'antd/es/button';
import 'antd/es/button/style';
import Input from 'antd/es/input';
import 'antd/es/input/style';
import Select from 'antd/es/select';
import 'antd/es/select/style';
import Space from 'antd/es/space';
import 'antd/es/space/style';
import Pagination from 'antd/es/pagination';
import 'antd/es/pagination/style';

const { Option } = Select;

const TableAdvertise = (props) => {
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
            title: () => <span style={{}} onClick={() => requestSort('id')}>ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
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
            title: () => <span  >Ảnh </span>,
            dataIndex: 'image',
            key: 'image',
            render: (image) => image ? <Image width={260} src={`${process.env.REACT_APP_BASE_URL}${image}`} /> : 'Không có ảnh'
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('banner')}>Banner {sortConfig.key === 'banner' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'banner',
            key: 'banner',
            render: (banner) => <Tag color={banner === 1 ? 'green' : 'blue'}>{banner}</Tag>
        },
        {
            className: 'first',
            title: 'Hoạt động',
            key: 'action',
            render: (text, record) => (
                <Space>
                    <button className="btn btn-warning mx-3"
                        onClick={() => props.handleUpdate(record, searchType, searchTerm)}>
                        Cập nhật</button>
                    <button className="btn btn-danger"
                        onClick={() => props.handleDelete(record, searchType, searchTerm)} > Xóa</button>

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
                    Thêm Banner và Quảng cáo mới
                </Button>

                <Space>

                    <Select value={searchType} onChange={setSearchType} style={{ width: '100px' }}>
                        <Option value="name">Tên</Option>
                        <Option value="banner">Banner</Option>
                    </Select>
                    <Input
                        style={{ width: '250px' }}
                        type={searchType === 'name' ? "text" : "number"}
                        placeholder={`Tìm kiếm theo ${searchType === 'name' ? 'tên banner' : 'loại banner'}...`}
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
                    total={rowCount} pageSize={6}
                    showSizeChanger={false}
                    onChange={handleAntdPageChange}
                />
            </div>
        </div>
    );
};

export default TableAdvertise;
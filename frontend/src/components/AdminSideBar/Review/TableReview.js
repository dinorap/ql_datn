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

import Typography from 'antd/es/typography';
import 'antd/es/typography/style';

import Button from 'antd/es/button';
import 'antd/es/button/style';

import Switch from 'antd/es/switch';
import 'antd/es/switch/style';

import AntModal from 'antd/es/modal';
import 'antd/es/modal/style';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { updateReviewActiveStatus } from "../../../services/apiReviewService";
import './Review.scss';

const { Option } = Select;

const TableReview = (props) => {
    const { list, currentPage, rowCount } = props;
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('product_name');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedReview, setSelectedReview] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        props.fetchListWithPaginate(currentPage, searchType, searchTerm);
    }, [searchTerm, searchType]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedList = [...list].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleAntdPageChange = (page) => {
        props.fetchListWithPaginate(page, searchType, searchTerm);
        props.setCurrentPage(page);
    };

    const handleClickToggleReview = (review) => {
        setSelectedReview(review);
        setShowConfirmModal(true);
    };

    const handleConfirmActiveChange = async () => {
        if (!selectedReview) return;
        const updatedStatus = selectedReview.is_active === 1 ? 0 : 1;
        const res = await updateReviewActiveStatus(selectedReview.id, updatedStatus);
        if (res?.EC === 0) {
            toast.success(res.EM);
            props.fetchListWithPaginate(currentPage, searchType, searchTerm);
        } else {
            toast.error(res?.EM || "Có lỗi xảy ra");
        }
        setShowConfirmModal(false);
        setSelectedReview(null);
    };

    const mainColumns = [
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('id')}>ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'id',
            key: 'id',
        },
        {
            className: 'first',
            title: () => <span onClick={() => requestSort('product_name')}>Sản phẩm {sortConfig.key === 'product_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'product_name',
            key: 'product_name',
        },
        {
            className: 'first',
            title: 'Người dùng',
            dataIndex: 'username',
            key: 'username',
            render: text => text || <Tag color="gray">Ẩn danh</Tag>
        },
        {
            className: 'first',
            title: 'Sao',
            dataIndex: 'rating',
            key: 'rating',
            render: rating => rating ? <Tag color="gold">{rating}★</Tag> : null
        },
        {
            className: 'first',
            title: 'Bình luận',
            dataIndex: 'comment',
            key: 'comment'
        },
        {
            className: 'first',
            title: 'Thời gian',
            dataIndex: 'created_at',
            key: 'created_at',
            render: text => new Date(text).toLocaleString()
        },
        {
            className: 'first',
            title: 'Hành động',
            key: 'action',
            render: (text, record) => (
                <Space>
                    <button className="btn btn-primary" onClick={() => props.handleReplyReview(record)}>Phản hồi</button>
                    <button className="btn btn-danger" onClick={() => props.handleDelete(record)}>Xóa</button>
                </Space>
            )
        },
        {
            className: 'first',
            title: 'Trạng thái',
            key: 'is_active',
            render: (_, record) => (
                <Space>
                    <Switch
                        checked={record.is_active === 1}
                        onChange={() => handleClickToggleReview(record)}

                    />
                    <span>{record.is_active === 1 ? "Đã duyệt" : "Chưa duyệt"}</span>
                </Space>
            )
        }
    ];

    const expandedRowRender = (record) => {
        const replyColumns = [
            {
                className: 'first',
                title: 'Người trả lời',
                dataIndex: 'username',
                key: 'username',
                render: text => text || <Tag color="gray">Hệ thống</Tag>
            },
            {
                className: 'first',
                title: 'Nội dung',
                dataIndex: 'comment',
                key: 'comment'
            },
            {
                className: 'first',
                title: 'Thời gian',
                dataIndex: 'created_at',
                key: 'created_at',
                render: text => new Date(text).toLocaleString()
            },
            {
                className: 'first',
                title: 'Hành động',
                key: 'action',
                render: (text, reply) => (
                    <Space>
                        <Button size="small" type="link" icon={<EditOutlined />} onClick={() => props.handleUpdate(reply)}>Sửa</Button>
                        <Button size="small" type="link" icon={<DeleteOutlined />} danger onClick={() => props.handleDeleteReply(reply)}>Xóa</Button>
                    </Space>
                )
            }
        ];

        return (
            <Table
                columns={replyColumns}
                dataSource={record.replies?.map(r => ({ ...r, key: r.id })) || []}
                pagination={false}
                size="small"
                bordered={false}
                rowKey="id"
            />
        );
    };

    return (
        <div>

            <AntModal
                className="ok"
                title="Xác nhận thay đổi trạng thái"
                open={showConfirmModal}
                onOk={handleConfirmActiveChange}
                onCancel={() => setShowConfirmModal(false)}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <p>Bạn có chắc muốn {selectedReview?.is_active === 1 ? "bỏ duyệt" : "duyệt"} đánh giá này?</p>
                <p><b>{selectedReview?.comment}</b></p>
            </AntModal>


            <div className="d-flex justify-content-between align-items-center mb-3">
                <Space>
                    <Select value={searchType} onChange={setSearchType} style={{ width: 180 }}>
                        <Option value="product_name">Tên sản phẩm</Option>
                        <Option value="username">Tên người dùng</Option>
                    </Select>
                    <Input
                        style={{ width: 250 }}
                        placeholder="Tìm kiếm..."
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
                columns={mainColumns}
                dataSource={sortedList.map(item => ({ ...item, key: item.id }))}
                pagination={false}
                bordered
                expandable={{
                    expandedRowRender,
                    rowExpandable: record => record.replies && record.replies.length > 0
                }}
                locale={{ emptyText: searchTerm ? "Không tìm thấy kết quả phù hợp" : "Không có dữ liệu" }}
            />


            <div className="d-flex justify-content-center mt-3">
                <Pagination
                    current={currentPage}
                    total={rowCount}
                    pageSize={10}
                    showSizeChanger={false}
                    onChange={handleAntdPageChange}
                />
            </div>
        </div>
    );
};

export default TableReview;

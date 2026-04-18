import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Input, Select, Pagination, Switch, Modal as AntModal } from 'antd';
import { FcPlus } from "react-icons/fc";
import "./Product.scss"
import { updateProductActiveStatus } from '../../../services/apiProductService';
import { toast } from 'react-toastify';

const { Option } = Select;


const TableProducts = (props) => {
    const {
        list,
        currentPage,
        rowCount,
        setCurrentPage,
        fetchListWithPaginate,
        handleView,
        handleViewVariant,
        handleUpdate,
        handleDelete,
        handleCreateVariant,
        handleUpdateVariant,
        handleUpdateOption,
        handleCreateOption
    } = props;

    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('name');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedReview, setSelectedReview] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchListWithPaginate(currentPage, searchType, searchTerm);
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

    const columns = [
        {
            className: "first",
            title: () => <span onClick={() => requestSort('id')}>ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'id',
        },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('product_code')}>Mã sản phẩm {sortConfig.key === 'product_code' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'product_code',
        },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('name')}>Tên sản phẩm {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'name',
        },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('company_name')}>Hãng {sortConfig.key === 'company_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'company_name',
        },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('average_rating')}>Đánh giá {sortConfig.key === 'average_rating' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'average_rating',
            render: (rating) => rating > 0 ? `${rating} ⭐` : 'Chưa có'
        },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('total_reviews')}>Tổng đánh giá {sortConfig.key === 'total_reviews' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'total_reviews',
            render: (total) => total > 0 ? `${total}` : 'Chưa có'

        },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('is_installment_available')}>Trả góp {sortConfig.key === 'is_installment_available' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'is_installment_available',
            render: (available) => available === 1 ? `Có` : 'Không'

        },
        {
            className: "first",
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (

                <Space>
                    <button className="btn btn-primary new-button" onClick={() => handleCreateVariant(record.id, searchType, searchTerm)}>Thêm biến thể</button>
                    <button className="btn btn-info new-button" onClick={() => handleView(record)}>Xem</button>
                    <button className="btn btn-warning new-button" onClick={() => handleUpdate(record, searchType, searchTerm)}>Cập nhật</button>
                    <button className="btn btn-danger new-button" onClick={() => handleDelete(record, 'product', searchType, searchTerm)}>Xoá</button>
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
                    <span>{record.is_active === 1 ? "Đang bán" : "Ngừng bán"}</span>
                </Space>
            )
        }
    ];
    const handleClickToggleReview = (review) => {
        setSelectedReview(review);
        setShowConfirmModal(true);
    };

    const handleConfirmActiveChange = async () => {
        if (!selectedReview) return;
        const updatedStatus = selectedReview.is_active === 1 ? 0 : 1;
        const res = await updateProductActiveStatus(selectedReview.id, updatedStatus);
        if (res?.EC === 0) {
            toast.success(res.EM);
            props.fetchListWithPaginate(currentPage, searchType, searchTerm);
        } else {
            toast.error(res?.EM || "Có lỗi xảy ra");
        }
        setShowConfirmModal(false);
        setSelectedReview(null);
    };

    const variantColumns = [
        {
            className: "first",
            title: 'Màu',
            dataIndex: 'color',
        },
        {
            className: "first",
            title: 'Mã biến thể',
            dataIndex: 'variant_code',
        },
        {
            className: "first",
            title: 'Giá gốc',
            dataIndex: 'base_price',
            render: (price) => `${parseInt(price).toLocaleString()} đ`
        },
        {
            className: "first",
            title: 'Khuyến mại',
            dataIndex: 'promotion',
            render: (promo) => promo ? <Tag color="green">{promo.promotion_type_name}</Tag> : 'Không có'
        },
        {
            className: "first",
            title: 'Giá trị khuyến mãi',
            dataIndex: 'promotion',
            render: (promo) => {
                if (!promo || !promo.promotion_code) return '-';

                const value = promo.discount_value;
                const type = promo.promotion_code;

                let display = '-';
                if (type === 'percentage') {
                    display = `Giảm ${value}%`;
                } else if (type === 'fixed_amount') {
                    display = `Giảm ${parseInt(value).toLocaleString()} đ`;
                } else if (type === 'custom_price') {
                    display = `Giá KM: ${parseInt(value).toLocaleString()} đ`;
                }

                return (
                    <Tag color="green">
                        {display}
                    </Tag>
                );
            }
        },
        {
            className: "first",
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <button className="btn btn-primary new-button" onClick={() => handleCreateOption(record.id, searchType, searchTerm)}>Thêm cấu hình</button>
                    <button className="btn btn-info new-button" onClick={() => handleViewVariant(record)}>Xem</button>
                    <button className="btn btn-warning new-button" onClick={() => handleUpdateVariant(record, searchType, searchTerm)}>Cập nhật</button>
                    <button className="btn btn-danger new-button" onClick={() => handleDelete(record, 'variant', searchType, searchTerm)}>Xoá</button>
                </Space>
            )
        }
    ];

    const optionColumns = [
        {
            className: "first",
            title: 'RAM',
            dataIndex: 'ram',
        },
        {
            className: "first",
            title: 'ROM',
            dataIndex: 'rom',
        },
        {
            className: "first",
            title: 'Extra (+)',
            dataIndex: 'extra_price',
            render: val => `+${parseInt(val).toLocaleString()} đ`
        },
        {
            className: "first",
            title: 'Tồn kho',
            dataIndex: 'stock_quantity',
        },
        {
            className: "first",
            title: 'Giá bán',
            dataIndex: 'final_price',
            render: val => `${parseInt(val).toLocaleString()} đ`
        },
        {
            className: "first",
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <button className="btn btn-warning new-button" onClick={() => handleUpdateOption(record, searchType, searchTerm)}>Cập nhật</button>
                    <button className="btn btn-danger new-button" onClick={() => handleDelete(record, 'option', searchType, searchTerm)}>Xoá</button>
                </Space>
            )
        },
    ];

    const expandedRowRender = (product) => (
        <Table
            columns={variantColumns}
            dataSource={product.variants?.map(v => ({ ...v, key: v.id })) || []}
            pagination={false}
            expandable={{
                expandedRowRender: (variant) => (
                    <Table
                        columns={optionColumns}
                        dataSource={variant.options?.map(o => ({ ...o, key: o.id })) || []}
                        pagination={false}
                        size="small"
                    />
                ),
                rowExpandable: (record) => record.options?.length > 0,
            }}
            size="middle"
        />
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchListWithPaginate(page, searchType, searchTerm);
    };

    return (
        <>

            <AntModal
                className="ok"
                title="Xác nhận thay đổi trạng thái"
                open={showConfirmModal}
                onOk={handleConfirmActiveChange}
                onCancel={() => setShowConfirmModal(false)}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <p>Bạn có chắc muốn {selectedReview?.is_active === 1 ? "Ngừng bán" : "Bán"} Sản phẩm {selectedReview?.name} này?</p>
            </AntModal>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Button className="success" type="primary" icon={<FcPlus />} onClick={() => props.setShowModalCreate(true)}>
                    Thêm Sản Phẩm
                </Button>
                <Space>
                    <Select value={searchType} onChange={setSearchType} style={{ width: 180 }}>
                        <Option value="name">Tên sản phẩm</Option>
                        <Option value="product_code">Mã sản phẩm</Option>
                        <Option value="is_active">Trạng thái</Option>
                    </Select>
                    {searchType === 'is_active' ? (
                        <Select
                            value={searchTerm}
                            onChange={(val) => {
                                setSearchTerm(val);
                                props.setCurrentPage(1);
                            }}
                            style={{ width: 250 }}
                            allowClear
                            placeholder="Chọn trạng thái"
                        >
                            <Option value="1">Đang bán</Option>
                            <Option value="0">Ngừng bán</Option>
                        </Select>
                    ) : (
                        < Input
                            placeholder={`Tìm kiếm theo ${searchType === 'name' ? 'tên sản phẩm' : "mã sản phẩm"
                                }...`}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            allowClear
                            style={{ width: 250 }}
                        />)}
                </Space>
            </div>


            <Table
                columns={columns}
                dataSource={sortedList.map(p => ({ ...p, key: p.id }))}
                expandable={{
                    expandedRowRender,
                    rowExpandable: (record) => record.variants?.length > 0,
                }}
                pagination={false}
            />


            <div className="d-flex justify-content-center mt-3">
                <Pagination
                    current={currentPage}
                    total={rowCount}
                    pageSize={10}
                    showSizeChanger={false}
                    onChange={handlePageChange}
                />
            </div>
        </>
    );
};

export default TableProducts;

import { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Tag, Modal, Space, Pagination, DatePicker, message } from 'antd';
import { CSVLink } from 'react-csv';
import { getAllOrders, getAllOrdersPP, updateOrderStatus } from '../../../services/apiOrderService';
import { toast } from 'react-toastify';
import "./Order.scss";
import dayjs from 'dayjs';
const { Option } = Select;
const { RangePicker } = DatePicker;

const OrderTable = () => {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchType, setSearchType] = useState('username');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ dates: [] });
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState(null);
    const [allExportOrders, setAllExportOrders] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });


    const csvHeaders = [
        { label: 'ID', key: 'id' },
        { label: 'Khách hàng', key: 'customer_name' },
        { label: 'User', key: 'username' },
        { label: 'Email', key: 'email' },
        { label: 'Số điện thoại', key: 'phone' },
        { label: 'Tổng tiền', key: 'total_price' },
        { label: 'Thanh toán', key: 'payment_method' },
        { label: 'Trạng thái', key: 'status_name' },
        { label: 'Thời gian', key: 'created_at' },
        { label: 'Ghi chú', key: 'note' },
        { label: 'Người nhận hộ', key: 'receiver_name' },
        { label: 'SDT người nhận hộ', key: 'receiver_phone' },
        { label: 'Chi tiết sản phẩm', key: 'product_details' }, { label: 'Quà', key: 'gift_details' }];


    useEffect(() => {

        fetchAllExportOrders();
    }, []);
    useEffect(() => {
        fetchOrders(1);
        fetchAllExportOrders();
    }, [searchTerm, searchType, filters.dates]);

    useEffect(() => {
        setSearchTerm('');
    }, [searchType]);

    const fetchOrders = async (page = 1) => {
        setLoading(true);
        const params = {
            page,
            limit: 10,
            [searchType]: searchTerm,
            startDate: Array.isArray(filters.dates) && filters.dates[0] ? filters.dates[0].format('YYYY-MM-DD') : undefined,
            endDate: Array.isArray(filters.dates) && filters.dates[1] ? filters.dates[1].format('YYYY-MM-DD') : undefined

        };
        const res = await getAllOrders(params);
        if (res.EC === 0) {
            setOrders(res.data.orders);
            setTotal(res.data.total);
            setCurrentPage(res.data.currentPage);
        }
        setLoading(false);
    };

    const fetchAllExportOrders = async () => {
        const res = await getAllOrdersPP();
        if (res.EC === 0) {
            setAllExportOrders(res.data.orders);
        }
    };

    const handleClickChangeStatus = (order, statusCode) => {
        setSelectedOrder(order);
        setNewStatus(statusCode);
        setShowConfirmModal(true);
    };

    const handleConfirmStatusChange = async () => {
        const res = await updateOrderStatus(selectedOrder.id, newStatus);
        if (res.EC === 0) {
            toast.success('Cập nhật trạng thái thành công!');
            fetchOrders(currentPage);
        } else {
            toast.error('Cập nhật thất bại!');
        }
        setShowConfirmModal(false);
        setSelectedOrder(null);
    };
    const copyOrderData = (order) => {
        const productLines = order.items.map(item => {
            const finalPrice = item.promotion_applied
                ? (item.unit_price - item.discount_value)
                : item.unit_price;

            return `- ${item.product_name} (${item.color}, ${item.ram}/${item.rom}), SL: ${item.quantity}, Giá gốc: ${parseInt(item.unit_price).toLocaleString()}đ, Giá sau KM: ${parseInt(finalPrice).toLocaleString()}đ`;
        }).join('\n    ');

        const orderText = `
    ===== Đơn hàng #${order.id} =====
    Khách hàng: ${order.customer_name} (${order.email})
    Địa chỉ: ${order.shipping_address}
    SDT: ${order.phone}
    Tổng tiền: ${parseInt(order.total_price).toLocaleString()} đ
    Ghi chú: ${order.note}
    
    Sản phẩm:
    ${productLines}
    
        `.trim();

        navigator.clipboard.writeText(orderText).then(() => {
            toast.success("Đã sao chép thông tin đơn hàng!");
        });
    };


    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedOrders = [...orders].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (typeof aValue === 'string') {
            return sortConfig.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
    });
    const printOrder = (order) => {
        const productLines = order.items.map(item => {
            return `
                - ${item.name} (${item.color}, ${item.ram}/${item.rom}), SL: ${item.quantity}, 
                Giá gốc: ${parseInt(item.base_price).toLocaleString()}đ, 
                Giá sau KM: ${parseInt(item.final_price).toLocaleString()}đ
            `;
        }).join('<br>');

        const GiftLines = order.items
            .map(item => {
                return item.gift
                    ? item.gift.split(";").map(g => `- ${g.trim()}`).join("<br>")
                    : "";
            })
            .join("<br>");


        const content = `
            <h2>Đơn hàng #${order.id}</h2>
            <p>Khách hàng: ${order.customer_name}</p>
            <p>Địa chỉ: ${order.shipping_address}</p>
            <p>SDT: ${order.phone}</p>
            ${order.receiver_name ? `<p>Người nhận hộ: ${order.receiver_name}</p> <p>SDT người nhận hộ: ${order.receiver_phone}</p>` : ""}
            <p>Tổng tiền: ${parseInt(order.total_price).toLocaleString()} đ</p>
            <p>Ghi chú: ${order.note}</p>
            <h3>Sản phẩm:</h3>
            <p>${productLines}</p>
            <h3>Quà tặng:</h3>
            ${GiftLines ? `<p>${GiftLines}</p>` : ""}
        `;

        const printWindow = window.open('', '_blank', 'toolbar=0,location=1000,menubar=0,scrollbars=0,resizable=0,width=1000,height=716');

        printWindow.document.write(`
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1" />

                    <title>In đơn hàng</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h2, h3 { margin: 0 0 10px 0; }
                        p { margin: 5px 0; }
                    </style>
                </head>
                <body>
                    ${content}
                    <script>
                        window.onload = function() {
                            window.print();
                            window.onafterprint = function() { window.close(); }
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
    };


    const columns = [
        {
            className: "first",
            title: () => <span onClick={() => requestSort('id')}>ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'id'
        },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('customer_name')}>Khách hàng {sortConfig.key === 'customer_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'customer_name'
        },
        { className: "first", title: 'SDT', dataIndex: 'phone' },
        {
            className: "first",
            title: () => <span onClick={() => requestSort('total_price')}>Tổng tiền {sortConfig.key === 'total_price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</span>,
            dataIndex: 'total_price',
            render: val => `${parseInt(val).toLocaleString()} đ`
        },
        {
            className: "first",
            title: () => (
                <span onClick={() => requestSort('delivery_method')}>
                    Phương thức nhận hàng {sortConfig.key === 'delivery_method' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </span>
            ),
            dataIndex: 'delivery_method',
            render: (val) =>
                val === 'pickup' ? 'Lấy tại cửa hàng' : val === 'delivery' ? 'Giao tận nơi' : 'Không xác định'
        },
        { className: "first", title: 'Địa chỉ', dataIndex: 'full_address' },
        { className: "first", title: 'Phương thức thanh toán', dataIndex: 'payment_method' },
        {
            className: "first",
            title: 'Nhận hàng bởi',
            dataIndex: "receiver_name",
            render: (val) =>
                val != null ? 'Nhận hộ' : 'Tự nhận'
        },
        {
            className: "first",
            title: 'Thời gian',
            dataIndex: 'created_at',
            render: (val) => dayjs(val).format('DD/MM/YYYY HH:mm:ss')
        },
        {
            className: "first",
            title: 'Trạng thái',
            render: (_, record) => (
                <Select value={record.status_name} onChange={(val) => handleClickChangeStatus(record, val)} style={{ width: 140 }}>
                    <Option value="1">Chờ xác nhận</Option>
                    <Option value="2">Đã xác nhận</Option>
                    <Option value="3">Đang giao</Option>
                    <Option value="4">Hoàn tất</Option>
                    <Option value="5">Đã hủy</Option>
                </Select>
            )
        },
        {
            className: "first act",
            title: 'Hành động',
            render: (_, record) => (
                <>
                    <Button style={{ marginRight: '5px' }} onClick={() => copyOrderData(record)}>Sao chép</Button>
                    <Button onClick={() => printOrder(record)}>In</Button>
                </>
            )
        }
    ];
    const processOrderDataForCSV = (orderList) => {
        return orderList.map(order => {
            const productDetails = order.items.map(item => {
                return `${item.name} - ${item.color} - ${item.ram}/${item.rom} - SL: ${item.quantity} - Giá gốc: ${parseInt(item.base_price).toLocaleString()}đ - Giá sau KM: ${parseInt(item.final_price).toLocaleString()}đ`;
            }).join(' | '); const giftDetails = order.items.map(item => {
                return `${item.gift}`
            }).join(' | ');
            return {
                ...order,
                gift_details: giftDetails,
                product_details: productDetails
            };
        });
    };


    return (
        <div>
            <Modal
                title="Xác nhận thay đổi trạng thái"
                open={showConfirmModal}
                onCancel={() => setShowConfirmModal(false)}
                onOk={handleConfirmStatusChange}
                okText="Xác nhận"
                cancelText="Hủy"
            >
                <p>Bạn có chắc muốn đổi trạng thái đơn hàng #{selectedOrder?.id} không?</p>
            </Modal>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <Space className='chc'>
                    <CSVLink
                        headers={csvHeaders}
                        data={processOrderDataForCSV(allExportOrders)}
                        filename="all_orders.csv"
                        className="btn btn-success chc"
                    >
                        Xuất tất cả CSV
                    </CSVLink>

                    <CSVLink
                        headers={csvHeaders}
                        data={processOrderDataForCSV(orders)}
                        filename="orders.csv"
                        className="btn btn-success chc"
                    >
                        Xuất CSV
                    </CSVLink>

                </Space>
                <Space>
                    <Select value={searchType} onChange={(val) => { setSearchType(val); setSearchTerm(''); setCurrentPage(1); }} style={{ width: 120 }}>
                        <Option value="customer_name">Khách hàng</Option>
                        <Option value="username">Username</Option>
                        <Option value="email">Email</Option>
                        <Option value="status">Trạng thái</Option>
                    </Select>
                    {searchType === 'status' ? (
                        <Select value={searchTerm || undefined} onChange={(val) => { setSearchTerm(val); setCurrentPage(1); }} style={{ width: 250 }} allowClear placeholder="Chọn trạng thái">
                            <Option value="pending">Chờ xác nhận</Option>
                            <Option value="confirmed">Đã xác nhận</Option>
                            <Option value="shipping">Đang giao</Option>
                            <Option value="completed">Hoàn tất</Option>
                            <Option value="cancelled">Đã hủy</Option>
                        </Select>
                    ) : (
                        <Input value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ width: 250 }} allowClear placeholder={`Tìm theo ${searchType}`} />
                    )}
                    <RangePicker className='search-date' onChange={(dates) => setFilters(prev => ({ ...prev, dates }))} />

                </Space>
            </div>
            <div className="table-scroll-wrapper">
                <Table
                    dataSource={sortedOrders.map((order, idx) => ({ ...order, key: idx }))}
                    columns={columns}
                    pagination={false}
                    bordered
                    loading={loading}
                    expandable={{
                        expandedRowRender: (record) => (
                            <>
                                <Table
                                    columns={[
                                        {
                                            className: "first",
                                            title: "Username",
                                            dataIndex: 'username'
                                        },
                                        {
                                            className: "first",
                                            title: () => "Email",
                                            dataIndex: 'email'
                                        },

                                        { className: "first", title: 'Ghi chú', dataIndex: 'note' },
                                        { className: "first", title: 'Người nhận hộ', dataIndex: 'receiver_name' },
                                        { className: "first", title: 'SDT người nhận hộ', dataIndex: 'receiver_phone' },
                                    ]}
                                    dataSource={[{ ...record }]}
                                    pagination={false}
                                    size="small"

                                />
                                <Table
                                    columns={[
                                        { className: "first", title: '#', render: (_, __, idx) => idx + 1 },
                                        { className: "first", title: 'Tên sản phẩm', dataIndex: 'name' },
                                        { className: "first", title: 'Màu', dataIndex: 'color' },
                                        { className: "first", title: 'RAM', dataIndex: 'ram' },
                                        { className: "first", title: 'ROM', dataIndex: 'rom' },
                                        { className: "first", title: 'Số lượng', dataIndex: 'quantity' },
                                        { className: "first", title: 'Giá gốc (1 SP)', dataIndex: 'base_price', render: val => `${parseInt(val).toLocaleString()} đ` },
                                        { className: "first", title: 'Giá sau KM', dataIndex: 'final_price', render: val => `${parseInt(val).toLocaleString()} đ` },
                                        {
                                            className: "first gift-fi",
                                            title: 'Quà tặng',
                                            render: (_, record) => {
                                                if (!record.gift) return '—';
                                                return record.gift
                                                    .split(';')
                                                    .filter(g => g.trim() !== '')
                                                    .map((gift, idx) => <div key={idx}>• {gift.trim()}</div>);
                                            }
                                        }

                                    ]}
                                    dataSource={record.items.map((item, idx) => ({ ...item, key: idx }))}
                                    pagination={false}
                                    size="small"

                                />
                            </>
                        )
                    }}
                />
            </div>
            <div className="d-flex justify-content-center mt-3">
                <Pagination current={currentPage} total={total} pageSize={10} showSizeChanger={false} onChange={(page) => fetchOrders(page)} />
            </div>
        </div>
    );
};

export default OrderTable;

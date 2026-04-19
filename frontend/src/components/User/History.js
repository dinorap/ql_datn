import React, { useEffect, useState } from 'react';
import { Tabs, Table, Tag, Button, Popconfirm } from 'antd';
import { getUserOrderHistory, cancelOrderById } from '../../services/apiOrderService';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import "./History.scss"
import { DatePicker } from 'antd';

const History = () => {
    const { RangePicker } = DatePicker;
    const account = useSelector(state => state.user.account);
    const [orders, setOrders] = useState([]);
    const [orderStatusTab, setOrderStatusTab] = useState('pending');
    const [cancellingOrderId, setCancellingOrderId] = useState(null);
    const [dateRange, setDateRange] = useState([null, null]);
    const [loading, setLoading] = useState(false);
    const statusTabs = [
        { key: "all", label: "Tất cả" },
        { key: "pending", label: "Chờ xác nhận" },
        { key: "confirmed", label: "Đã xác nhận" },
        { key: "shipping", label: "Đang giao" },
        { key: "completed", label: "Hoàn tất" },
        { key: "cancelled", label: "Đã huỷ" }
    ];

    const fetchOrders = async () => {
        if (!account?.id) return;
        setLoading(true);
        const statusFilter = orderStatusTab === 'all' ? null : orderStatusTab;
        const start_date = dateRange?.[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : null;
        const end_date = dateRange?.[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : null;

        try {
            const res = await getUserOrderHistory(account.id, statusFilter, start_date, end_date);
            if (res?.EC === 0) {
                setOrders(res.data || []);
            } else {
                setOrders([]);
            }
        } catch (error) {
            setOrders([]);
            toast.error("Không tải được lịch sử đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (dates) => {
        setDateRange(dates);
    };
    useEffect(() => {
        fetchOrders();
    }, [account?.id, orderStatusTab, dateRange]);

    const handleCancelOrder = async (orderId) => {
        setCancellingOrderId(orderId);
        try {
            const res = await cancelOrderById(orderId);
            if (res && res.EC === 0) {
                toast.success("Huỷ đơn hàng thành công");
                fetchOrders();
            } else {
                toast.error(res?.EM || "Không thể huỷ đơn hàng");
            }
        } finally {
            setCancellingOrderId(null);
        }
    };
    const baseColumns = [
        { className: 'first', title: 'Mã đơn', dataIndex: 'id', key: 'id' },
        { className: 'first', title: 'Ngày đặt', dataIndex: 'created_at', render: val => dayjs(val).format("DD/MM/YYYY") },
        { className: 'first', title: 'Trạng thái', dataIndex: 'status_name', render: (text) => <Tag color="red">{text}</Tag> },
        { className: 'first', title: 'Thanh toán', dataIndex: 'payment_method' },
        { className: 'first', title: 'Giao hàng', dataIndex: 'delivery_method', render: text => text === 'pickup' ? 'Tại cửa hàng' : 'Giao tận nơi' },
        { className: 'first', title: 'Tổng tiền', dataIndex: 'total_price', render: val => <span className="order-price">{Number(val).toLocaleString()}₫</span> },
    ];

    const actionColumn = {
        className: 'first',
        title: 'Hành động',
        render: (_, record) => (
            <Popconfirm
                title="Xác nhận huỷ đơn?"
                onConfirm={() => handleCancelOrder(record.id)}
                disabled={record.status_code !== 'pending'}
            >
                <Button
                    danger
                    size="small"
                    className="cancel-btn"
                    disabled={record.status_code !== 'pending'}
                    loading={cancellingOrderId === record.id}
                >
                    Huỷ đơn
                </Button>
            </Popconfirm>
        )
    };

    const orderColumns = [...baseColumns, actionColumn];


    return (
        <div className="order-history">
            <div className="order-history__head">
                <Tabs
                    className="order-history__tabs"
                    activeKey={orderStatusTab}
                    onChange={setOrderStatusTab}
                    items={statusTabs}
                />

                <RangePicker
                    className="order-history__range"
                    format="DD/MM/YYYY"
                    value={dateRange}
                    onChange={onDateChange}
                />
            </div>

            <div className="order-history__table-wrap">
                <Table
                    rowKey="id"
                    columns={orderColumns}
                    dataSource={orders}
                    loading={loading}
                    pagination={false}
                    scroll={{ y: 520 }}
                    locale={{ emptyText: "Không có đơn hàng nào" }}
                    expandable={{
                        expandedRowRender: (record) => (
                            <div className="history-items-wrap">
                                <div className="history-items-list">
                                    {record.items?.map((item, index) => (
                                        <div key={index} className="history-item-card">
                                            <img
                                                src={`${process.env.REACT_APP_BASE_URL}${item.image}`}
                                                alt="ảnh sản phẩm"
                                                className="history-item-image"
                                            />
                                            <div className="history-item-meta">
                                                <div className="history-item-name">{item.name}</div>
                                                <div className="history-item-variant">
                                                    Màu: {item.color} - RAM: {item.ram} - ROM: {item.rom}
                                                </div>
                                                <div className="history-item-price">
                                                    Số lượng:<span> x{item.quantity} </span> | {Number(item.final_price).toLocaleString()}₫
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    }}
                />
            </div>
        </div>
    );
};

export default History;
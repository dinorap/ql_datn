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
    const [dateRange, setDateRange] = useState([null, null]); const statusTabs = [
        { key: "all", label: "Tất cả" },
        { key: "pending", label: "Chờ xác nhận" },
        { key: "confirmed", label: "Đã xác nhận" },
        { key: "shipping", label: "Đang giao" },
        { key: "completed", label: "Hoàn tất" },
        { key: "cancelled", label: "Đã huỷ" }
    ];

    const fetchOrders = async () => {
        const statusFilter = orderStatusTab === 'all' ? null : orderStatusTab;
        const start_date = dateRange?.[0] ? dayjs(dateRange[0]).format("YYYY-MM-DD") : null;
        const end_date = dateRange?.[1] ? dayjs(dateRange[1]).format("YYYY-MM-DD") : null;

        const res = await getUserOrderHistory(account.id, statusFilter, start_date, end_date);
        if (res?.EC === 0) {
            setOrders(res.data);
        }
    };

    const onDateChange = (dates) => {
        setDateRange(dates);
    };
    useEffect(() => {
        fetchOrders();
    }, [orderStatusTab, dateRange]);

    const handleCancelOrder = async (orderId) => {
        const res = await cancelOrderById(orderId);
        if (res && res.EC === 0) {
            toast.success("Huỷ đơn hàng thành công");
            fetchOrders();
        } else {
            toast.error("Không thể huỷ đơn hàng");
        }
    };
    const baseColumns = [
        { className: 'first', title: 'Mã đơn', dataIndex: 'id', key: 'id' },
        { className: 'first', title: 'Ngày đặt', dataIndex: 'created_at', render: val => dayjs(val).format("DD/MM/YYYY") },
        { className: 'first', title: 'Trạng thái', dataIndex: 'status_name', render: (text) => <Tag>{text}</Tag> },
        { className: 'first', title: 'Thanh toán', dataIndex: 'payment_method' },
        { className: 'first', title: 'Giao hàng', dataIndex: 'delivery_method', render: text => text === 'pickup' ? 'Tại cửa hàng' : 'Giao tận nơi' },
        { className: 'first', title: 'Tổng tiền', dataIndex: 'total_price', render: val => Number(val).toLocaleString() + '₫' },
    ];

    const actionColumn = {
        className: 'first',
        title: 'Hành động',
        render: (_, record) => (
            <Popconfirm title="Xác nhận huỷ đơn?" onConfirm={() => handleCancelOrder(record.id)}>
                <Button danger size="small">Huỷ đơn</Button>
            </Popconfirm>
        )
    };

    const orderColumns = orderStatusTab === 'pending'
        ? [...baseColumns, actionColumn]
        : baseColumns;


    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <Tabs
                        activeKey={orderStatusTab}
                        onChange={setOrderStatusTab}
                        tabBarStyle={{ overflow: 'visible' }}
                    >
                        {statusTabs.map(tab => (
                            <Tabs.TabPane tab={tab.label} key={tab.key} />
                        ))}
                    </Tabs>
                </div>

                <RangePicker
                    format="DD/MM/YYYY"
                    value={dateRange}
                    onChange={onDateChange}
                    style={{ marginBottom: "13px", marginLeft: "190px" }}
                />

            </div>


            <Table
                rowKey="id"
                columns={orderColumns}
                dataSource={orders}
                pagination={false}
                scroll={{ y: 500 }}
                expandable={{
                    expandedRowRender: (record) => (
                        <div style={{ maxHeight: 200, overflowY: 'auto', padding: '8px 12px', backgroundColor: '#fafafa' }}>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {record.items?.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            background: '#fff',
                                            borderRadius: 6,
                                            padding: 10,
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                            alignItems: 'flex-start',
                                            gap: 12,
                                            alignItems: "center",

                                        }}
                                    >
                                        <img
                                            src={`${process.env.REACT_APP_BASE_URL}${item.image}`}
                                            alt="ảnh sản phẩm"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                objectFit: 'cover',
                                                borderRadius: 6,
                                                flexShrink: 0
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                                            <div style={{ fontSize: 13, color: '#555' }}>
                                                Màu: {item.color} – RAM: {item.ram} – ROM: {item.rom}
                                            </div>
                                            <div style={{ fontSize: 13 }}>
                                                Số lượng:<span style={{ color: "red", fontWeight: 600 }}> x{item.quantity} </span>&nbsp;&nbsp;|&nbsp;&nbsp;
                                                <span style={{ fontWeight: 600, color: "red" }}>{Number(item.final_price).toLocaleString()}₫</span>
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
    );
};

export default History;
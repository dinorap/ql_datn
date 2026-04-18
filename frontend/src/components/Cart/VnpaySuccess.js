import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createOrder, sendOrder } from "../../services/apiOrderService";
import "./VnpaySuccess.scss";
import { deleteCartItem, getCartCount } from "../../services/apiCartService";
import { useDispatch, useSelector } from "react-redux";
import { setCartCount } from '../../redux/slices/userSlice';
const VnpaySuccess = () => {
    const navigate = useNavigate();
    const account = useSelector((state) => state.user.account);
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState(null); const handleSendOrderMail = async ({ email, name, cart_items, total }) => {
        try {
            const res = await sendOrder({
                email: email,
                customer_name: name,
                cart_items: cart_items.map(item => ({
                    name: item.name,
                    color: item.color,
                    ram: item.ram,
                    rom: item.rom,
                    quantity: item.quantity
                })),
                total_price: total
            });

            if (res && res.EC === 0) {
                console.log('📩 Email xác nhận đơn hàng đã được gửi.');
            } else {
                console.warn('❗ Gửi email thất bại:', res);
            }
        } catch (error) {
            console.error('❌ Lỗi khi gửi email xác nhận:', error);
        }
    };
    useEffect(() => {
        const handlePayment = async () => {
            const responseCode = searchParams.get("vnp_ResponseCode");
            if (responseCode === "00") {
                const orderData = JSON.parse(localStorage.getItem("pendingOrder"));
                if (!orderData) return setStatus(false);
                const res = await createOrder(orderData);
                if (res && res.EC === 0) {
                    for (const item of orderData.cart_items) {
                        await deleteCartItem(item.cart_item_id);
                    }

                    const countRes = await getCartCount(account?.id);
                    if (countRes && countRes.EC === 0) {
                        dispatch(setCartCount(Number(countRes.count || 0)));
                    }
                    localStorage.removeItem("pendingOrder");
                    setStatus(true);
                    handleSendOrderMail({
                        email: orderData.email,
                        name: orderData.customer_name,
                        cart_items: orderData.cart_items,
                        total: orderData.total_price
                    });
                } else {
                    setStatus(false);
                }
            } else {
                setStatus(false);
            }
        };

        handlePayment();
    }, []);

    return (
        <div className="vnpay-success-container">
            {status === null ? (
                <h3>Đang xử lý thanh toán...</h3>
            ) : status === true ? (
                <div className="card1 success1">
                    <div className="icon"><img src='/mark.png' /></div>
                    <h2>Thanh toán thành công</h2>
                    <p>Đơn hàng của bạn đã được Thanh toán thành công. Chúng tôi sẽ sớm liên hệ với bạn để bàn giao sản phẩm . Cảm ơn bạn đã mua sắm!</p>
                    <button onClick={() => navigate("/cart")}>Quay lại giỏ hàng</button>
                </div>
            ) : (
                <div className="card1 fail">
                    <div className="icon"><img src='/cancel.png' /></div>
                    <h2>Thanh toán thất bại</h2>
                    <p>Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
                    <button onClick={() => navigate("/cart")}>Quay lại giỏ hàng</button>
                </div>
            )}
        </div>
    );
};

export default VnpaySuccess;

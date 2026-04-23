import React from "react";
import "./CardPaymentModal.scss";

const CardPaymentModal = ({
    isOpen,
    amount,
    onClose,
    onTestPayment,
    loading = false,
}) => {
    if (!isOpen) return null;
    const displayAmount = Number(amount || 0).toLocaleString("vi-VN");

    return (
        <div className="card-payment-modal__overlay" onClick={onClose}>
            <div
                className="card-payment-modal__content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Thanh toán bằng thẻ"
            >
                <div className="card-payment-modal__header">
                    <div className="card-payment-modal__title-wrap">
                        <h3>Thanh toán đơn hàng</h3>
                        <p>Quét QR để thanh toán nhanh và chính xác số tiền</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Đóng">
                        x
                    </button>
                </div>

                <div className="card-payment-modal__body">
                    <div className="card-payment-modal__left">
                        <div className="card-payment-modal__qr-wrap">
                            <div className="card-payment-modal__qr-title">
                                <span className="chip">VIETQR</span>
                                <span className="chip chip--soft">Bảo mật SSL</span>
                            </div>
                            <img src="/qrcode.png" alt="QR thanh toán" />
                        </div>
                        <div className="card-payment-modal__bank-info">
                            <div>Ngân hàng: ACB</div>
                            <div>Số tài khoản: 23766621</div>
                            <div>
                                Số tiền: <strong>{displayAmount} VND</strong>
                            </div>
                        </div>
                        <div className="card-payment-modal__transfer-info">
                            <label>Nội dung chuyển khoản</label>
                            <div className="readonly">ORDER-{Date.now().toString().slice(-6)}</div>
                        </div>
                    </div>
                </div>

                <div className="card-payment-modal__footer">
                    <button type="button" className="secondary" onClick={onClose} disabled={loading}>
                        Hủy
                    </button>
                    <button type="button" className="primary" onClick={onTestPayment} disabled={loading}>
                        {loading ? "Đang xử lý..." : "Thanh toán"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CardPaymentModal;

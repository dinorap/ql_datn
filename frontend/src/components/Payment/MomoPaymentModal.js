import React from "react";
import "./MomoPaymentModal.scss";

const MomoPaymentModal = ({
    isOpen,
    amount,
    onClose,
    onTestPayment,
    loading = false,
}) => {
    if (!isOpen) return null;
    const displayAmount = Number(amount || 0).toLocaleString("vi-VN");

    return (
        <div className="momo-modal__overlay" onClick={onClose}>
            <div
                className="momo-modal__content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Thanh toán MoMo"
            >
                <div className="momo-modal__header">
                    <div className="momo-modal__header-main">
                        <h3>Thanh toán MoMo</h3>
                        <p>Ví điện tử - thanh toán nhanh trong vài giây</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Đóng">x</button>
                </div>

                <div className="momo-modal__body">
                    <div className="momo-modal__brand">MoMo</div>
                    <img src="/qrcode.png" alt="MoMo QR" />
                    <div className="momo-modal__amount">{displayAmount} VND</div>
                    <div className="momo-modal__memo">MOMO-ORDER-{Date.now().toString().slice(-6)}</div>
                </div>

                <div className="momo-modal__footer">
                    <button type="button" className="secondary" onClick={onClose} disabled={loading}>
                        Hủy
                    </button>
                    <button type="button" className="primary" onClick={onTestPayment} disabled={loading}>
                        {loading ? "Đang xử lý..." : "Thanh toán MoMo"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MomoPaymentModal;

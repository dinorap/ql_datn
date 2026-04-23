import React, { useState } from "react";

const MomoPaymentManual = () => {
    const [isPaid, setIsPaid] = useState(false);
    const [orderId, setOrderId] = useState(`TEST-${Date.now().toString().slice(-6)}`);
    const [amount, setAmount] = useState(1990000);
    const [orderInfo, setOrderInfo] = useState("Don hang test frontend");

    const handleSimulatePay = () => {
        setIsPaid(true);
    };

    const handleReset = () => {
        setIsPaid(false);
        setOrderId(`TEST-${Date.now().toString().slice(-6)}`);
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <img
                    src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                    alt="MoMo"
                    style={styles.logo}
                />
                <h2 style={styles.title}>MoMo Manual Test</h2>
                <p style={styles.sub}>UI test only - khong goi backend</p>

                <label style={styles.label}>Ma don hang</label>
                <input style={styles.input} value={orderId} onChange={(e) => setOrderId(e.target.value)} />

                <label style={styles.label}>So tien (VND)</label>
                <input
                    style={styles.input}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />

                <label style={styles.label}>Noi dung</label>
                <input style={styles.input} value={orderInfo} onChange={(e) => setOrderInfo(e.target.value)} />

                <div style={styles.infoBox}>
                    <div><b>Order:</b> {orderId}</div>
                    <div><b>Amount:</b> {amount.toLocaleString("vi-VN")} VND</div>
                    <div><b>Info:</b> {orderInfo}</div>
                </div>

                {!isPaid ? (
                    <button style={styles.payBtn} onClick={handleSimulatePay}>
                        Gia lap "Da thanh toan MoMo"
                    </button>
                ) : (
                    <div style={styles.successBox}>
                        Da danh dau thanh toan thanh cong (manual test).
                    </div>
                )}

                <button style={styles.resetBtn} onClick={handleReset}>
                    Reset trang thai
                </button>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px"
    },
    card: {
        width: "100%",
        maxWidth: "500px",
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        padding: "24px"
    },
    logo: {
        width: "88px",
        height: "88px",
        objectFit: "contain",
        display: "block",
        margin: "0 auto 8px"
    },
    title: {
        textAlign: "center",
        color: "#c2185b",
        marginBottom: "4px"
    },
    sub: {
        textAlign: "center",
        color: "#666",
        marginTop: 0,
        marginBottom: "16px",
        fontSize: "14px"
    },
    label: {
        display: "block",
        marginBottom: "6px",
        fontSize: "14px",
        color: "#333"
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #d8d8d8",
        marginBottom: "12px"
    },
    infoBox: {
        background: "#fff0f6",
        border: "1px solid #ffd3e3",
        borderRadius: "10px",
        padding: "12px",
        margin: "10px 0 14px",
        fontSize: "14px",
        lineHeight: 1.6
    },
    payBtn: {
        width: "100%",
        background: "#d81b60",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "12px",
        fontWeight: 600,
        cursor: "pointer"
    },
    successBox: {
        width: "100%",
        background: "#e8f5e9",
        color: "#2e7d32",
        border: "1px solid #b7dfba",
        borderRadius: "10px",
        padding: "12px",
        textAlign: "center",
        fontWeight: 600
    },
    resetBtn: {
        width: "100%",
        marginTop: "10px",
        background: "#f0f0f0",
        color: "#333",
        border: "none",
        borderRadius: "10px",
        padding: "11px",
        cursor: "pointer"
    }
};

export default MomoPaymentManual;

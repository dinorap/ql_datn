import React, { useMemo, useState } from "react";

const BankTransferPaymentManual = () => {
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [amount, setAmount] = useState(1990000);
    const [accountNumber, setAccountNumber] = useState("1234567890");
    const [accountName, setAccountName] = useState("CONG TY TNHH TECHZONE");
    const [bankName, setBankName] = useState("Vietcombank");

    const transferCode = useMemo(
        () => `TESTCK${Date.now().toString().slice(-7)}`,
        []
    );

    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            console.error("Copy failed", e);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <h2 style={styles.title}>Chuyen Khoan Ngan Hang - Manual Test</h2>
                <p style={styles.sub}>UI test only - khong xac nhan giao dich that</p>

                <label style={styles.label}>Ngan hang</label>
                <input style={styles.input} value={bankName} onChange={(e) => setBankName(e.target.value)} />

                <label style={styles.label}>So tai khoan</label>
                <input style={styles.input} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />

                <label style={styles.label}>Chu tai khoan</label>
                <input style={styles.input} value={accountName} onChange={(e) => setAccountName(e.target.value)} />

                <label style={styles.label}>So tien (VND)</label>
                <input
                    style={styles.input}
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                />

                <div style={styles.infoBox}>
                    <div><b>Bank:</b> {bankName}</div>
                    <div><b>STK:</b> {accountNumber} <button style={styles.linkBtn} onClick={() => copyText(accountNumber)}>Copy</button></div>
                    <div><b>Name:</b> {accountName}</div>
                    <div><b>Noi dung CK:</b> {transferCode} <button style={styles.linkBtn} onClick={() => copyText(transferCode)}>Copy</button></div>
                    <div><b>So tien:</b> {amount.toLocaleString("vi-VN")} VND</div>
                </div>

                {!isConfirmed ? (
                    <button style={styles.confirmBtn} onClick={() => setIsConfirmed(true)}>
                        Toi da chuyen khoan (gia lap)
                    </button>
                ) : (
                    <div style={styles.successBox}>
                        Da xac nhan thanh toan thu cong (manual UI test).
                    </div>
                )}
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
        maxWidth: "560px",
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
        padding: "24px"
    },
    title: {
        margin: 0,
        marginBottom: "4px",
        color: "#123b69"
    },
    sub: {
        marginTop: 0,
        marginBottom: "16px",
        color: "#666",
        fontSize: "14px"
    },
    label: {
        display: "block",
        marginBottom: "6px",
        fontSize: "14px"
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        borderRadius: "8px",
        border: "1px solid #d8d8d8",
        marginBottom: "12px"
    },
    infoBox: {
        background: "#f0f7ff",
        border: "1px solid #cde3ff",
        borderRadius: "10px",
        padding: "12px",
        marginBottom: "14px",
        lineHeight: 1.7,
        fontSize: "14px"
    },
    linkBtn: {
        border: "none",
        background: "transparent",
        color: "#1677ff",
        cursor: "pointer",
        padding: "0 0 0 6px",
        fontSize: "13px"
    },
    confirmBtn: {
        width: "100%",
        background: "#1565c0",
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
    }
};

export default BankTransferPaymentManual;

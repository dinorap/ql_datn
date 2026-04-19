require("dotenv").config();
const dayjs = require("dayjs");
const crypto = require("crypto");
const qs = require("qs");
const axios = require("axios");


const vnp_TmnCode = process.env.VNP_TMNCODE;
const vnp_HashSecret = process.env.VNP_HASH_SECRET;
const vnp_Url = process.env.VNP_URL;
const vnp_ReturnUrl = process.env.VNP_RETURN_URL;

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[decodeURIComponent(str[key])]).replace(/%20/g, "+");
    }
    return sorted;
}

const createVnpayPayment = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        const orderId = dayjs().format("DDHHmmss");
        const createDate = dayjs().format("YYYYMMDDHHmmss");

        const ipAddr =
            req.headers["x-forwarded-for"] ||
            req.connection.remoteAddress ||
            "127.0.0.1";

        let vnp_Params = {
            vnp_Version: "2.1.0",
            vnp_Command: "pay",
            vnp_TmnCode,
            vnp_Locale: "vn",
            vnp_CurrCode: "VND",
            vnp_TxnRef: orderId,
            vnp_OrderInfo: "Thanh toán đơn hàng #" + orderId,
            vnp_OrderType: "other",
            vnp_Amount: amount * 100,
            vnp_ReturnUrl,
            vnp_IpAddr: ipAddr,
            vnp_CreateDate: createDate,
        };

        vnp_Params = sortObject(vnp_Params);

        const signData = qs.stringify(vnp_Params, { encode: false });

        const secureHash = crypto
            .createHmac("sha512", vnp_HashSecret)
            .update(Buffer.from(signData, "utf-8"))
            .digest("hex");

        vnp_Params['vnp_SecureHash'] = secureHash;

        const paymentUrl = `${vnp_Url}?${qs.stringify(vnp_Params, { encode: false })}`;

        res.json({
            EC: 0,
            EM: "Tạo URL thanh toán VNPAY thành công",
            data: { paymentUrl },
        });
    } catch (error) {
        console.error("❌ Lỗi tạo thanh toán VNPAY:", error);
        res.status(500).json({
            EC: 1,
            EM: "Lỗi khi tạo thanh toán",
            error: error.message,
        });
    }
};


const PAYPAL_BASE_URL = process.env.PAYPAL_BASE_URL;
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const RETURN_URL = process.env.PAYPAL_RETURN_URL;
const CANCEL_URL = process.env.PAYPAL_CANCEL_URL;
const PAYPAL_VND_TO_USD_RATE = Number(process.env.PAYPAL_VND_TO_USD_RATE || 25000);

const convertVndToUsd = (vndAmount) => {
    if (!Number.isFinite(vndAmount) || vndAmount <= 0) {
        return null;
    }
    const usdRaw = vndAmount / PAYPAL_VND_TO_USD_RATE;
    const usdRounded = Math.round(usdRaw * 100) / 100;
    // PayPal cần chuỗi decimal, tối đa 2 chữ số thập phân.
    return usdRounded.toFixed(2);
};

const getAccessToken = async () => {
    const res = await axios({
        method: "post",
        url: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
        auth: {
            username: CLIENT_ID,
            password: CLIENT_SECRET,
        },
        params: {
            grant_type: "client_credentials",
        },
    });
    return res.data.access_token;
};
const createPaypalPayment = async (req, res) => {
    try {
        const amountVnd = Number(req.body.amount);
        const amountUsd = convertVndToUsd(amountVnd);
        if (!amountUsd) {
            return res.status(400).json({
                EC: 1,
                EM: "Số tiền thanh toán PayPal không hợp lệ",
            });
        }

        const token = await getAccessToken();

        const response = await axios.post(
            `${PAYPAL_BASE_URL}/v2/checkout/orders`,
            {
                intent: "CAPTURE",
                purchase_units: [{
                    amount: {
                        currency_code: "USD",
                        value: amountUsd,
                    },
                }],
                application_context: {
                    return_url: RETURN_URL,
                    cancel_url: CANCEL_URL,
                },
            },
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        const approvalUrl = response.data.links.find(link => link.rel === "approve")?.href;

        res.json({
            EC: 0,
            EM: "Tạo URL thanh toán PayPal thành công",
            data: { approval_url: approvalUrl }
        });
    } catch (error) {
        console.error("❌ Lỗi tạo thanh toán PayPal:", error);
        res.status(500).json({
            EC: 1,
            EM: "Lỗi khi tạo thanh toán",
            error: error.message
        });
    }
};
const capturePaypalPayment = async (req, res) => {
    try {
        const { token: orderToken } = req.body;
        const token = await getAccessToken();

        const response = await axios.post(
            `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderToken}/capture`,
            {},
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error("❌ Lỗi xác nhận thanh toán PayPal:", error);
        res.status(500).json({
            EC: 1,
            EM: "Lỗi khi xác nhận thanh toán",
            error: error.message
        });
    }
};
module.exports = {
    createVnpayPayment,
    createPaypalPayment,
    capturePaypalPayment,
};






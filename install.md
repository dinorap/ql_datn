# Webtech - Quick Install Guide

Huong dan nay de nguoi khac clone repo va chay du an local nhanh nhat.

## 1) Yeu cau cai dat truoc

- Git
- Node.js 18+ va npm
- Docker Desktop (co docker compose)

## 2) Clone project

```bash
git clone <repo-url>
cd Webtech
```

## 3) Chay MySQL bang Docker Compose

```bash
docker compose up -d
docker compose ps
```

Mac dinh theo `docker-compose.yml`:

- MySQL host: `localhost`
- Port: `3306`
- Database: `mobile`
- User: `root`
- Password: `123456`

Neu can dung lai container/database:

```bash
docker compose down
docker compose up -d
```

Neu can xoa toan bo data MySQL trong volume:

```bash
docker compose down -v
docker compose up -d
```

## 4) Tao file env

### Backend env: `backend/.env`

Tao file `backend/.env` voi cac bien:

```env
PORT=5000
HOST_NAME=localhost

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_DATABASE=mobile

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret

JWT_RESET_SECRET=your_reset_secret
JWT_RESET_EXPIRES_IN=15m
CLIENT_URL=http://localhost:3000

EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password

GEMINI_API_KEY=your_gemini_api_key

VNP_TMNCODE=your_vnp_tmncode
VNP_HASH_SECRET=your_vnp_hash_secret
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNP_RETURN_URL=http://localhost:3000/vnpay-success

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_RETURN_URL=http://localhost:3000/paypal-success
PAYPAL_CANCEL_URL=http://localhost:3000/cart
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

### Frontend env: `frontend/.env`

```env
REACT_APP_BASE_URL=http://localhost:5000
```

## 5) Cai dependencies

Mo 2 terminal rieng:

### Terminal 1 - Backend

```bash
cd backend
npm install
npm start
```

Backend chay mac dinh: `http://localhost:5000`

### Terminal 2 - Frontend

```bash
cd frontend
npm install
npm start
```

Frontend chay mac dinh: `http://localhost:3000`

## 6) Kiem tra nhanh sau khi chay

- Mo `http://localhost:3000`
- Thu xem danh sach san pham/trang chu
- Thu login, gio hang
- Thu chatbot (neu da set `GEMINI_API_KEY`)

## 7) Troubleshooting nhanh

- Loi ket noi DB:
  - Kiem tra `docker compose ps`
  - Kiem tra lai `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_DATABASE` trong `backend/.env`
- Port bi trung:
  - Doi `PORT` backend hoac giai phong port 3000/5000/3306
- Chua co schema/data:
  - Import schema/data vao DB `mobile` truoc khi test full tinh nang
- Loi thanh toan/email:
  - Kiem tra lai bien PayPal, VNPAY, SMTP trong `backend/.env`

## 8) Lenh tat he thong

Tat frontend/backend: `Ctrl + C` o tung terminal.

Tat MySQL container:

```bash
docker compose down
```

---

Goi y: khong commit file `.env` that len git. Chi chia se file mau hoac gia tri da an thong tin nhay cam.

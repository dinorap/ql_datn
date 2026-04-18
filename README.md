# THẾ GIỚI CÔNG NGHỆ

<img width="3179" height="4494" alt="image" src="https://github.com/user-attachments/assets/31e117f1-deb9-46a7-90ae-bba13d663872" />

*Tăng tốc phát triển - Kết nối hiệu quả*

![last commit](https://img.shields.io/badge/last%20commit-hôm%20nay-brightgreen)
![javascript](https://img.shields.io/badge/javascript-81.3%25-yellow)
![languages](https://img.shields.io/badge/s%E1%BB%91%20ng%C3%B4n%20ng%E1%BB%AF-5-blue)

---

## Công nghệ & Công cụ sử dụng

![Express](https://img.shields.io/badge/-Express-black?logo=express)
![JSON](https://img.shields.io/badge/-JSON-lightgrey?logo=json)
![npm](https://img.shields.io/badge/-npm-CB3837?logo=npm)
![dotenv](https://img.shields.io/badge/-.ENV-yellowgreen)
![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript)
![EJS](https://img.shields.io/badge/-EJS-yellow)
![Nodemon](https://img.shields.io/badge/-Nodemon-green)
![React Bootstrap](https://img.shields.io/badge/-React%20Bootstrap-00D8FF?logo=react)
![React](https://img.shields.io/badge/-React-61DAFB?logo=react)
![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker)
![Lodash](https://img.shields.io/badge/-Lodash-blue)
![Axios](https://img.shields.io/badge/-Axios-blue)
![Bootstrap](https://img.shields.io/badge/-Bootstrap-7952B3?logo=bootstrap)
![CSS](https://img.shields.io/badge/-CSS-264de4?logo=css3)
![Sass](https://img.shields.io/badge/-Sass-cc6699?logo=sass)

---

## Mục lục

1. [Giới thiệu](#3-giới-thiệu)
2. [Bắt đầu](#4-bắt-đầu)
   - [Yêu cầu hệ thống](#41-yêu-cầu-hệ-thống)
   - [Cài đặt](#42-cài-đặt)
   - [Sử dụng](#43-sử-dụng)
   - [Kiểm thử](#44-kiểm-thử)
3. [Kiến trúc hệ thống](#5-kiến-trúc-hệ-thống)
4. [Biểu đồ Use Case](#6-biểu-đồ-use-case)
5. [Sơ đồ phân rã chức năng](#7-sơ-đồ-phân-rã-chức-năng)

---

## 1. Giới thiệu

**Thế Giới Công Nghệ** là nền tảng web thương mại điện tử toàn diện, tối ưu hóa trải nghiệm người dùng trong cả frontend và backend, giúp bạn phát triển hệ thống nhanh chóng và chuyên nghiệp.

### Vì sao nên chọn Thế Giới Công Nghệ?

- **Xác thực người dùng an toàn**: Đăng ký, đăng nhập bảo mật, ngăn ngừa rò rỉ dữ liệu.
- **Quản lý gói phụ thuộc**: Đồng bộ thư viện với `package-lock.json`.
- **Tính giá động**: Tính toán khuyến mãi theo thời gian thực trong giỏ hàng.
- **Cập nhật dữ liệu trực tiếp**: Hiển thị thông tin sản phẩm và đơn hàng tức thì.
- **Quản lý quản trị viên**: Hệ thống quản lý người dùng, sản phẩm, đơn hàng hiệu quả.
- **Giao diện hiện đại**: Tối ưu cho mọi thiết bị, sử dụng thư viện Ant Design.

---

## 2. Bắt đầu

### Yêu cầu hệ thống

- **Ngôn ngữ lập trình**: JavaScript
- **Trình quản lý gói**: Npm
- **Hệ thống container**: Docker

---

### Cài đặt

1. **Clone dự án về máy:**

```bash
git clone https://github.com/dinorap/test_readme
```

2. **Di chuyển vào thư mục dự án:**

```bash
cd test_readme
```

3. **Cài đặt thư viện phụ thuộc:**

- **Sử dụng Docker:**

```bash
docker build -t dinorap/test_readme .
```

- **Sử dụng Npm:**

```bash
npm install
```

---

### Sử dụng

- **Khởi chạy bằng Docker:**

```bash
docker run -it dinorap/test_readme
```

- **Khởi chạy bằng Npm:**

```bash
npm start
```

---

### Kiểm thử

Hệ thống sử dụng `{test_framework}` để kiểm thử. Chạy kiểm thử bằng:

- **Docker:**

```bash
echo 'INSERT-TEST-COMMAND-HERE'
```

- **Npm:**

```bash
npm test
```
## 3. Kiến trúc hệ thống phần mềm (System Architecture Diagram)

Sơ đồ dưới đây thể hiện kiến trúc hệ thống của một ứng dụng web thương mại điện tử được xây dựng theo mô hình 4 lớp hiện đại. Sơ đồ sử dụng cú pháp **Mermaid Flowchart** để trực quan hóa từng thành phần trong hệ thống.

---

### 1. Client Layer (Lớp giao diện người dùng)

- **React SPA**: Ứng dụng giao diện một trang (Single Page Application)
- **Tính năng chính**:
  - `Customer UI Routes`: giao diện cho khách hàng
  - `Admin UI Routes`: giao diện quản trị viên
  - `Redux Store`: quản lý trạng thái toàn cục
  - `API Service Wrappers`: gọi API backend thông qua `Axios`
  - `Axios Customization`: cấu hình riêng cho Axios để xử lý request/response

---

### 2. API Layer (Lớp ứng dụng - Backend)

- **Express Server**: máy chủ chính nhận và xử lý HTTP request
- **Các module cấu thành**:
  - `Auth Middleware`: xác thực người dùng
  - `Upload/Cleanup Middleware`: xử lý upload ảnh, file
  - `REST & View Routes`: các tuyến đường API và trang view
  - `Business Logic Controllers`: xử lý nghiệp vụ
  - `Database / Email / View Engine Config`: các module cấu hình

---

### 3. Data Layer (Lớp dữ liệu)

- **MySQL Database**: hệ quản trị cơ sở dữ liệu chính
- **Local File Store**: nơi lưu trữ file ảnh, tài liệu upload cục bộ

---

### 4. External Services Layer (Dịch vụ ngoài hệ thống)

- **Email SMTP Service**: gửi email xác nhận / thông báo
- **PayPal / VNPAY Gateway**: các cổng thanh toán tích hợp
- **Chat-bot NLP API**: hệ thống chatbot hỗ trợ người dùng bằng xử lý ngôn ngữ tự nhiên (AI)

---

### Mối liên hệ giữa các tầng

- React SPA gửi request qua HTTP đến Express Server
- Express xử lý request thông qua các Middleware và Routes
- Controllers xử lý logic, truy vấn DB hoặc gọi dịch vụ ngoài
- Dữ liệu phản hồi được gửi lại cho giao diện người dùng

---

### Điểm nổi bật

- Phân chia rõ ràng giữa **frontend**, **backend**, **data**, và **dịch vụ bên ngoài**
- Hỗ trợ **mở rộng**, **bảo trì**, và **triển khai độc lập**
- Mỗi thành phần đều có thể quản lý và phát triển module riêng biệt
- Sơ đồ có thể mở rộng để tích hợp thêm Redis, WebSocket, hoặc CI/CD pipeline nếu cần

---

> **Sơ đồ này đóng vai trò quan trọng trong việc hiểu tổng quan hệ thống, hỗ trợ nhóm phát triển phối hợp hiệu quả hơn trong triển khai backend, frontend và tích hợp dịch vụ.**


![image](https://github.com/user-attachments/assets/817a3415-6bd9-4c88-8d13-854af3fa7642)

---
## 4. Biểu đồ Use case
Biểu đồ Use Case mô tả các **tác nhân chính** và các **chức năng tương tác với hệ thống**. Trong hệ thống website thương mại điện tử, có hai nhóm tác nhân chính:

- **Người dùng**: bao gồm cả khách vãng lai và người đã đăng nhập.
- **Quản trị viên**: người chịu trách nhiệm quản lý toàn bộ hệ thống.

Biểu đồ này giúp thể hiện tổng thể các chức năng như:

- Người dùng: Đăng ký, đăng nhập, tìm kiếm sản phẩm, so sánh, xem chi tiết, đặt hàng, đánh giá, cập nhật thông tin cá nhân...
- Quản trị viên: Quản lý sản phẩm, đơn hàng, khách hàng, nội dung, khuyến mãi, đánh giá và banner quảng cáo.

> Sơ đồ Use Case là công cụ quan trọng trong phân tích yêu cầu, làm rõ ai là người sử dụng hệ thống và họ cần những gì.
![tech drawio (2)](https://github.com/user-attachments/assets/01b73826-7802-405f-8224-ba2d3d5f941d)

---
## 5. Sơ đồ phân rã chức năng (Function Decomposition Diagram)

Sơ đồ phân rã chức năng thể hiện **cấu trúc logic của toàn bộ hệ thống**, bắt đầu từ một khối chức năng tổng thể và phân rã dần thành các chức năng chi tiết hơn.

### Phân nhánh chính:
- **Người dùng**: bao gồm tất cả các chức năng liên quan đến quá trình mua sắm và quản lý tài khoản.
- **Quản trị viên**: bao gồm các chức năng quản trị và vận hành hệ thống.

### Một số chức năng cụ thể:
#### Người dùng:
- Đăng nhập / Đăng ký
- Tìm kiếm, so sánh sản phẩm
- Xem chi tiết, xem tin tức
- Thêm vào giỏ hàng, đặt hàng, thanh toán
- Quản lý thông tin cá nhân: họ tên, email, số điện thoại, mật khẩu
- Gửi đánh giá, phản hồi sản phẩm

#### Quản trị viên:
- Quản lý khách hàng: khóa/mở tài khoản, xem lịch sử đơn hàng
- Quản lý sản phẩm: thêm/sửa/xoá, thống kê tồn kho, quản lý biến thể
- Quản lý đơn hàng: duyệt, cập nhật trạng thái, thống kê theo trạng thái
- Quản lý tin tức: thêm/sửa/xoá bài viết, hiển thị bài viết
- Quản lý khuyến mãi: tạo mã, gán sản phẩm, theo dõi hiệu quả
- Quản lý đánh giá: duyệt phản hồi, xoá đánh giá sai lệch
- Quản lý banner quảng cáo: cập nhật vị trí hiển thị

>  Sơ đồ này rất hữu ích cho việc lập trình theo module, phân công công việc và xây dựng giao diện quản trị hiệu quả.
![active drawio (1)](https://github.com/user-attachments/assets/c57e160f-62a1-4c58-a84e-8688812b377c)


⬆️ [Quay lại đầu](#mục-lục)


## 6. Các tài khoản, mật khẩu để test

### 🔑 Admin
- **Tài khoản:** `admin@gmail.com`  
- **Mật khẩu:** `admin@gmail.com`

### 💳 PayPal (Tài khoản sandbox)
- **Email:** `sb-tzmqx39102154@personal.example.com`  
- **Mật khẩu:** `jYm[-o86`

### 🏦 VNPay – Thẻ test
- **Ngân hàng:** NCB  
- **Số thẻ:** `9704198526191432198`  
- **Chủ thẻ:** NGUYEN VAN A  
- **Ngày phát hành:** 07/15  
- **Mã OTP:** `123456`

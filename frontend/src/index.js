import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import './index.css';
import "bootstrap/dist/css/bootstrap.min.css";
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { TinTuc, TuyenDung, BaoHanh, LienHe, GioiThieu } from './page/Home/Other';
import './locales/i18n.js';
import Forgot from './page/Auth/Forgot'
import Signup from './page/Auth/Signup';
import Login from './page/Auth/Login';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, Bounce } from 'react-toastify';
import ResetPassword from './page/Auth/ResetPassword';
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./redux/store";
import { Provider } from "react-redux";
import 'nprogress/nprogress.css'
import { Cart } from './page/Cart/Cart';
import Admin from './page/Admin/Admin';
import ThongKe from './page/Admin/AdminOtherPage/ThongKe'
import ATinTuc from './page/Admin/AdminOtherPage/ATinTuc';
import QuangCao from './page/Admin/AdminOtherPage/QuangCao';

import KhachHang from './page/Admin/AdminOtherPage/KhachHang';
import DonHang from './page/Admin/AdminOtherPage/DonHang';

import SharedLayout from './page/Home/SharedLayout';
import Home from './page/Home/Products/Home';
import AVideo from './page/Admin/AdminOtherPage/AVideo';
import KhuyenMai from './page/Admin/AdminOtherPage/KhuyenMai';
import NotFound from './page/Others/NotFound';
import DanhGia from './page/Admin/AdminOtherPage/DanhGia';
import Profile from './page/User/Profile';
import History from './components/User/History';
import UserProfile from './components/User/UserProfile';
import Development from './page/Others/Development';
import DienThoai from './page/Admin/AdminOtherPage/SanPham/DienThoai';
import MayTinh from './page/Admin/AdminOtherPage/SanPham/MayTinh';
import MayTinhBang from './page/Admin/AdminOtherPage/SanPham/MayTinhBang';

import AdminRoute from './components/Router/AdminRoute';
import SearchResultPage from './page/Home/Search/SearchResultPage';
import ProductDetailPage from './page/Home/DetailPage/ProductDetailPage';
import ProductsPage from './page/Home/Products/ProductsPage';
import ScrollToTop from './components/Router/ScrollToTop ';
import ComparePage from './page/Home/Products/ComparePage';
import VnpaySuccess from './components/Cart/VnpaySuccess';
import PaypalSuccess from './components/Cart/PaypalSuccess';

const root = ReactDOM.createRoot(document.getElementById('root'));


root.render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: '#d70018',
        colorLink: '#d70018',
        colorLinkHover: '#b80014',
      },
    }}
  >
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<App />} >
            <Route element={<SharedLayout />}>
              <Route index element={<Home />} />
            </Route>
            <Route path="sanpham/:categoryLabel" element={<ProductsPage />} />
            <Route path="search" element={<SearchResultPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="products/:id" element={<ProductDetailPage />} />
            <Route path="cart" element={<Cart />} />
            <Route path="thongtin" element={<Profile />}>
              <Route index element={<UserProfile />} />
              <Route path="lichsu" element={<History />} />
            </Route>
            <Route path="tintuc" element={<TinTuc />} />
            <Route path="tuyendung" element={<TuyenDung />} />
            <Route path="gioithieu" element={<GioiThieu />} />
            <Route path="baohanh" element={<BaoHanh />} />
            <Route path="lienhe" element={<LienHe />} />
          </Route>
          <Route path="/admin" element={
            <AdminRoute allowedRoles={['admin', 'staff', 'product_manager', 'marketer', 'editor']}>
              <Admin />
            </AdminRoute>
          }>

            <Route index element={
              <AdminRoute allowedRoles={['admin']}>
                <ThongKe />
              </AdminRoute>
            } />


            <Route path="khachhang" element={
              <AdminRoute allowedRoles={['admin', 'staff']}>
                <KhachHang />
              </AdminRoute>
            } />


            <Route path="tintuc" element={
              <AdminRoute allowedRoles={['admin', 'editor']}>
                <ATinTuc />
              </AdminRoute>
            } />
            <Route path="video" element={
              <AdminRoute allowedRoles={['admin', 'editor']}>
                <AVideo />
              </AdminRoute>
            } />


            <Route path="quangcao" element={
              <AdminRoute allowedRoles={['admin', 'marketer']}>
                <QuangCao />
              </AdminRoute>
            } />


            <Route path="dienthoai" element={
              <AdminRoute allowedRoles={['admin', 'product_manager']}>
                <DienThoai />
              </AdminRoute>
            } />
            <Route path="maytinh" element={
              <AdminRoute allowedRoles={['admin', 'product_manager']}>
                <MayTinh />
              </AdminRoute>
            } />
            <Route path="maytinhbang" element={
              <AdminRoute allowedRoles={['admin', 'product_manager']}>
                <MayTinhBang />
              </AdminRoute>
            } />



            <Route path="donhang" element={
              <AdminRoute allowedRoles={['admin', 'staff']}>
                <DonHang />
              </AdminRoute>
            } />


            <Route path="khuyenmai" element={
              <AdminRoute allowedRoles={['admin', 'marketer']}>
                <KhuyenMai />
              </AdminRoute>
            } />


            <Route path="danhgia" element={
              <AdminRoute allowedRoles={['admin', 'staff', 'product_manager']}>
                <DanhGia />
              </AdminRoute>
            } />
          </Route>

          <Route path="/vnpay-success" element={<VnpaySuccess />} />
          <Route path="/paypal-success" element={<PaypalSuccess />} />
          <Route path="*" element={<NotFound />} />
          <Route path="login" element={<Login />}></Route>
          <Route path="signup" element={<Signup />}></Route >
          <Route path="forgot" element={<Forgot />}></Route>
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="thongbao" element={<Development />} />


        </Routes>
        <ToastContainer
          position="top-center"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Bounce}
        />
      </BrowserRouter>
    </PersistGate>
  </Provider>
  </ConfigProvider>
);
reportWebVitals();




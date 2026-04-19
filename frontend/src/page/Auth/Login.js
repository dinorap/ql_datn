import React, { useState } from "react";
import "./Auth.scss";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { useDispatch } from "react-redux";
import { ImSpinner10 } from "react-icons/im";
import LoginImage from "../../assets/Auth/login-pana.svg";
import { postLogin } from "../../services/apiService";
import { loginSuccess, aloginSuccess, setCartCount } from "../../redux/slices/userSlice";
import { getCartCount, mergeCartToServer } from "../../services/apiCartService";
import { checkLowStock } from '../../services/apiAdminService';
const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const checkLowStockInventory = async () => {
        try {
            const response = await checkLowStock();
            if (response && response.data && response.EC === 0) {
                const lowStockData = response.data || [];
                setLowStockProducts(lowStockData);

                // Hiển thị toast warning nếu có sản phẩm tồn kho thấp
                if (lowStockData.length > 0) {
                    // Hiển thị toast chính
                    toast.warning(
                        `Cảnh báo: Có ${lowStockData.length} sản phẩm có tồn kho dưới 5! Vui lòng kiểm tra và bổ sung tồn kho ngay.`,
                        {
                            position: "top-right",
                            autoClose: 10000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        }
                    );

                    // Hiển thị toast chi tiết cho từng sản phẩm
                    lowStockData.forEach((product, index) => {

                        let productInfo = product.product_name;
                        if (product.ram) productInfo += ` - RAM: ${product.ram}GB`;
                        if (product.rom) productInfo += ` - ROM: ${product.rom}GB`;
                        if (product.color) productInfo += ` - Màu: ${product.color}`;
                        productInfo += ` (Còn: ${product.stock_quantity})`;

                        toast.info(
                            `${productInfo}`,
                            {
                                position: "top-right",
                                autoClose: 10000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                            }
                        );

                    });
                } else {
                    console.log('✅ Không có sản phẩm nào tồn kho thấp');
                }
            } else {
                console.log('❌ Lỗi khi kiểm tra tồn kho:', response);
            }
        } catch (error) {
            console.error('💥 Lỗi khi kiểm tra tồn kho:', error);
        }
    };
    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            );
    };
    const roleRedirectMap = {
        admin: '/admin',
        staff: '/admin/khachhang',
        product_manager: '/admin/donhang',
        marketer: '/admin/khuyenmai',
        editor: '/admin/tintuc'
    };
    const handleLogin = async () => {
        if (!validateEmail(email)) {
            toast.error("Email không hợp lệ");
            return;
        }
        if (!password) {
            toast.error("Mật khẩu là bắt buộc");
            return;
        }

        setIsLoading(true);
        let data = await postLogin(email, password);
        const localCart = JSON.parse(localStorage.getItem("temp_cart")) || [];
        if (data && data.EC === 0 && data.user.role === 'user') {
            toast.success(data.EM);
            dispatch(loginSuccess(data.user));


            if (localCart.length > 0) {
                try {
                    await mergeCartToServer(data.user.id, localCart);
                    localStorage.removeItem("temp_cart");
                } catch (err) {
                    console.error("Lỗi khi merge local cart:", err);
                }
            }

            let res = await getCartCount(data.user.id);
            if (res && res.count && res.EC === 0) {
                dispatch(setCartCount(Number(res.count)));
            } else {
                dispatch(setCartCount(0));
            }

            setIsLoading(false);
            navigate("/");
        } else if (data && data.EC === 0) {
            const role = data.user.role;
            const redirectPath = roleRedirectMap[role] || "/";

            const roleLabels = {
                admin: "Admin",
                staff: "Nhân viên",
                product_manager: "Quản lý sản phẩm",
                marketer: "Marketing",
                editor: "Biên tập viên"
            };

            const roleLabel = roleLabels[role] || "người dùng";

            toast.success(`Đăng nhập vào ${roleLabel} thành công`);
            dispatch(aloginSuccess(data.user));
            if (role === 'admin' || role === 'product_manager') {

                await checkLowStockInventory();
            }
            setIsLoading(false);
            navigate(redirectPath);

        } else {
            toast.error(data.EM);
            setIsLoading(false);
        }
    };


    return (
        <div className="home">
            <div className="Auth">
                <form className="auth-visual">
                    <div className="visual-top">
                        <Link to="/" className="back-home-btn">Quay lại trang chủ</Link>
                    </div>
                    <img src={LoginImage} alt="Login" />
                </form>
                <form className="myform auth-panel" onSubmit={(e) => e.preventDefault()}>
                    <p className="auth-subtitle">Đăng nhập tài khoản</p>
                    <h3>
                        Chào mừng bạn trở lại
                    </h3>
                    <div>
                        <input
                            type="email"
                            placeholder="Địa chỉ Email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="off"
                        />
                        <div className="mydiv">
                            <div className="password-input">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="off"
                                />
                                <span
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="eye-icon"
                                >
                                    {showPassword ? <VscEye /> : <VscEyeClosed />}
                                </span>
                            </div>
                            <Link className="forgot-link" to="/forgot">
                                Quên mật khẩu
                            </Link>
                        </div>
                        <div className="second-div">
                            <button
                                type="button"
                                onClick={handleLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? <ImSpinner10 className="loader-icon" /> : "Đăng nhập"}
                            </button>
                            <div className="flex-div">
                                <p>
                                    Chưa có tài khoản? <Link to="/signup"><b>Đăng ký ngay</b></Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div >
    );
};

export default Login;

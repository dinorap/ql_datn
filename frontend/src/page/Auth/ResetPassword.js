import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import ResetImage from "../../assets/Auth/reset.svg";
import { toast } from "react-toastify";
import { postResetPassword } from "../../services/apiService";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { ImSpinner10 } from "react-icons/im";
import "./Auth.scss";

const ResetPassword = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showPassword1, setShowPassword1] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        if (!token) {
            toast.error("Liên kết không hợp lệ hoặc đã hết hạn!");
            setTimeout(() => navigate("/forgot-password"), 2000);
        }
    }, [token, navigate]);

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (!newPassword || !confirmPassword) {
            return toast.error("Vui lòng nhập đầy đủ thông tin!");
        }
        if (newPassword.length < 6) {
            return toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
        }
        if (newPassword !== confirmPassword) {
            return toast.error("Mật khẩu xác nhận không khớp!");
        }

        try {
            const response = await postResetPassword(token, newPassword);
            if (response && response.EC === 0) {
                toast.success(response.EM || "Mật khẩu đã cập nhật thành công!");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                toast.error(response.EM || "Lỗi đặt lại mật khẩu, thử lại!");
            }
        } catch (error) {
            toast.error("Đã xảy ra lỗi, vui lòng thử lại!");
        }
    };

    return (
        <div className="home">
            <div className="Auth">
                <form className="auth-visual">
                    <div className="visual-top">
                        <Link to="/" className="back-home-btn">Quay lại trang chủ</Link>
                    </div>
                    <img src={ResetImage} alt="Reset Password" />
                </form>
                <form className="myform auth-panel">
                    <h3>🔒 Đặt lại mật khẩu</h3>
                    <div className="reset-password">

                        <div className="mydiv">
                            <div className="password-input">
                                <input
                                    type={showPassword1 ? "text" : "password"}
                                    placeholder="Mật khẩu mới"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <span onClick={() => setShowPassword1(!showPassword1)} className="eye-icon">
                                    {showPassword1 ? <VscEye /> : <VscEyeClosed />}
                                </span>
                            </div>
                        </div>

                        <div className="mydiv">
                            <div className="password-input">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Xác nhận mật khẩu mới"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">
                                    {showPassword ? <VscEye /> : <VscEyeClosed />}
                                </span>
                            </div>
                        </div>

                        <div className="second-div">
                            <button type="button" onClick={handleResetPassword}>
                                Đặt lại mật khẩu
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;

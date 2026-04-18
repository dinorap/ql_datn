import React, { useState } from "react";
import "./Auth.scss";
import { Link, useNavigate } from "react-router-dom";
import ForgotImage from "../../assets/Auth/forgot.svg"
import { toast } from "react-toastify";
import { postForgotPassword } from "../../services/apiService";
import { ImSpinner10 } from "react-icons/im";
const Forgot = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleForgot = async (e) => {
        e.preventDefault();

        if (!email) {
            toast.error(" Vui lòng nhập email!")
        }
        setIsLoading(true);
        let response = await postForgotPassword(email);
        if (response && response.EC === 0) {
            toast.success(response.EM || "Email đặt lại mật khẩu đã được gửi!");
            setIsLoading(false);
            navigate('/login')
        }
        if (response && response.EC !== 0) {
            toast.error(response?.EM || "Lỗi gửi email, thử lại sau!");
            setIsLoading(false);
        }
    };

    return (
        <div className="home">

            <div className="Auth">

                <form>
                    <img src={ForgotImage} alt="Forgot Password" />
                </form>
                <form className="myform" >
                    <h3 style={{ marginBottom: "-13px" }}>
                        Xin chào <em>👋</em>, Quên mật khẩu!
                    </h3>
                    <div>
                        <input
                            type="email"
                            placeholder="Địa chỉ Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <div className="second-div">
                            <button type="button" onClick={handleForgot}
                                disabled={isLoading}>
                                {isLoading ? <ImSpinner10 className="loader-icon" /> : "Quên mật khẩu"}
                            </button>
                            <p>
                                <Link to="/login" color="blue">Quay lại đăng nhập</Link>
                            </p>
                        </div>
                    </div>
                </form>

            </div>
        </div>

    );
};

export default Forgot;

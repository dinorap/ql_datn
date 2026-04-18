import React, { useState } from "react";
import "./Auth.scss";
import { Link, useNavigate } from "react-router-dom";
import SignupImage from "../../assets/Auth/signup.svg"
import { toast } from "react-toastify";
import { postSignup } from "../../services/apiService";
import { VscEye, VscEyeClosed } from "react-icons/vsc";
import { ImSpinner10 } from "react-icons/im";
const Signup = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [username, setUsername] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showPassword1, setShowPassword1] = useState(false)
    const [isLoading, setIsLoading] = useState(false);

    const handleShowHidePassword = (showPassword) => {
        setShowPassword(!showPassword)
    }
    const handleShowHidePassword1 = (showPassword) => {
        setShowPassword1(!showPassword)
    }
    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };
    const handleSigup = async () => {
        if (!validateEmail(email)) {
            toast.error("Email không hợp lệ")
            return;
        }
        if (!password) {
            toast.error("Mật khẩu là bắt buộc")
            return;
        }
        if (password !== confirmPassword) {
            toast.error("Mật khẩu không khớp")
            return;
        }
        setIsLoading(true);
        let data = await postSignup(email, username, password)
        if (data && data.EC === 0) {
            toast.success(data.EM);
            setIsLoading(false);
            navigate('/login')
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
            setIsLoading(false);
        }

    }


    return (
        <>
            <div className="home">
                <div className="Auth">
                    <form>
                        <img src={SignupImage} alt="" srcSet="" />
                    </form>
                    <form className="myform">
                        <h3 style={{ marginBottom: "-13px" }}>
                            Xin chào <em>👋</em>, Chào mừng bạn!
                        </h3>
                        <div>
                            <input type="email" placeholder="Địa chỉ Email" required
                                value={email} onChange={(event) => setEmail(event.target.value)} />
                            <div className="mydiv">
                                <input type="text" placeholder="Tên người dùng"
                                    value={username} onChange={(event) => setUsername(event.target.value)} />
                            </div>

                            <div className="mydiv">
                                <div className="password-input">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mật khẩu mới"
                                        required
                                        value={password} onChange={(event) => setPassword(event.target.value)}
                                    />
                                    <span onClick={() => handleShowHidePassword(showPassword)} className="eye-icon">
                                        {showPassword ? <VscEye /> : <VscEyeClosed />}
                                    </span>
                                </div>
                            </div>
                            <div className="mydiv">
                                <div className="password-input">
                                    <input
                                        type={showPassword1 ? "text" : "password"}
                                        placeholder="Xác nhận mật khẩu"
                                        required
                                        value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
                                    />
                                    <span onClick={() => handleShowHidePassword1(showPassword1)} className="eye-icon">
                                        {showPassword1 ? <VscEye /> : <VscEyeClosed />}
                                    </span>
                                </div>

                            </div>
                            <div className="second-div">
                                <button type="button" onClick={handleSigup}
                                    disabled={isLoading}>
                                    {isLoading ? <ImSpinner10 className="loader-icon" /> : "Đăng ký"}
                                </button>
                                <p>
                                    Đã có tài khoản <Link to="/login">Đăng nhập</Link>
                                </p>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default Signup;

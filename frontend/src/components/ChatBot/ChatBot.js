import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaCommentAlt, FaTimes, FaRobot } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { postChatBot } from "../../services/apiService"; import "./ChatBot.scss";
import { SiDependabot } from "react-icons/si";
const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: "bot", text: "Chào bạn 👋\nTôi có thể giúp gì cho bạn hôm nay?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false); const textareaRef = useRef(null);

    const toggleChatbot = () => setIsOpen(!isOpen);

    const sendMessage = async () => {
        if (input.trim() === "") return;

        const userMessage = { sender: "user", text: input };
        setMessages([...messages, userMessage]); setInput("");
        setLoading(true);
        try {
            const response = await postChatBot(input); const botReply = { sender: "bot", text: response.response_data }; setMessages((prevMessages) => [...prevMessages, botReply]);
        } catch (error) {
            const errorMsg = error.response?.data?.EM || "Lỗi không xác định, vui lòng thử lại!";
            setMessages((prevMessages) => [
                ...prevMessages,
                { sender: "bot", text: errorMsg }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const resizeTextArea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto"; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    };

    useEffect(() => {
        resizeTextArea();
    }, [input]);

    return (
        <div className="chatbot-container">
            <button className="btn btn-primary chatbot-toggler" onClick={toggleChatbot}>
                {isOpen ? <FaTimes /> : <SiDependabot />}
            </button>

            {isOpen && (
                <div className="chatbot">
                    <header className="d-flex justify-content-between align-items-center p-2 border-bottom">
                        <h5 className="header-chat"><FaRobot /> ChatBot</h5>
                        <button className="close-btn" onClick={toggleChatbot}><FaTimes /></button>
                    </header>

                    <ul className="chatbox list-unstyled p-2 overflow-auto">
                        {messages.map((msg, index) => (
                            <li key={index} className={`chat ${msg.sender}`}>
                                {msg.sender === "bot" && <FaRobot className="me-2" />}
                                <p className="mb-1">{msg.text}</p>
                            </li>
                        ))}
                        {loading && <li className="chat bot">⏳ Đang suy nghĩ...</li>}
                    </ul>

                    <div className="chat-input d-flex border-top p-2">
                        <textarea
                            ref={textareaRef}
                            className="form-control me-2"
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                            style={{ height: "auto", maxHeight: "150px", overflowY: "auto", resize: "none" }}
                            disabled={loading}                        ></textarea>
                        <button className="btn btn-primary" onClick={sendMessage} disabled={loading}>
                            <IoIosSend />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBot;

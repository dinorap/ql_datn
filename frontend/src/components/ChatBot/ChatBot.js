import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { FaTimes, FaRobot, FaComments } from "react-icons/fa";
import { IoIosSend } from "react-icons/io";
import { postChatBot } from "../../services/apiService";
import "./ChatBot.scss";

const DEFAULT_MESSAGES = [
    { sender: "bot", text: "Chào bạn 👋\nTôi có thể giúp gì cho bạn hôm nay?" },
];

const getHistoryStorageKey = (accountId) =>
    `chatbot_history_${accountId || "guest"}`;

const normalizeHistory = (raw) => {
    if (!Array.isArray(raw)) return DEFAULT_MESSAGES;
    const normalized = raw
        .filter(
            (m) =>
                m &&
                (m.sender === "user" || m.sender === "bot") &&
                typeof m.text === "string" &&
                m.text.trim() !== ""
        )
        .map((m) => ({ sender: m.sender, text: m.text }));
    return normalized.length ? normalized : DEFAULT_MESSAGES;
};

const ChatBot = () => {
    const accountId = useSelector((state) => state?.user?.account?.id || "");
    const [isOpen, setIsOpen] = useState(false);
    const [isHoveringToggler, setIsHoveringToggler] = useState(false);
    const [isHoveringSupportLauncher, setIsHoveringSupportLauncher] = useState(false);
    const [showAiHintNudge, setShowAiHintNudge] = useState(false);
    const [showSupportHintNudge, setShowSupportHintNudge] = useState(false);
    const [messages, setMessages] = useState(DEFAULT_MESSAGES);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const textareaRef = useRef(null);
    const chatEndRef = useRef(null);
    const supportHoverRef = useRef(false);

    const toggleChatbot = () => setIsOpen(!isOpen);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    }, [messages, loading, isOpen]);

    useEffect(() => {
        const storageKey = getHistoryStorageKey(accountId);
        try {
            const saved = localStorage.getItem(storageKey);
            if (!saved) {
                setMessages(DEFAULT_MESSAGES);
                return;
            }
            const parsed = JSON.parse(saved);
            setMessages(normalizeHistory(parsed));
        } catch (err) {
            setMessages(DEFAULT_MESSAGES);
        }
    }, [accountId]);

    useEffect(() => {
        const storageKey = getHistoryStorageKey(accountId);
        try {
            localStorage.setItem(storageKey, JSON.stringify(messages));
        } catch (err) {
            // Không chặn trải nghiệm chat nếu localStorage đầy hoặc bị chặn.
        }
    }, [messages, accountId]);

    useEffect(() => {
        if (isOpen) {
            setShowAiHintNudge(false);
            setShowSupportHintNudge(false);
            return undefined;
        }

        const cycleInterval = window.setInterval(() => {
            setShowAiHintNudge(true);
            setShowSupportHintNudge(true);
            window.setTimeout(() => setShowAiHintNudge(false), 5000);
            window.setTimeout(() => setShowSupportHintNudge(false), 5000);
        }, 10 * 60 * 1000);

        return () => {
            window.clearInterval(cycleInterval);
        };
    }, [isOpen]);

    useEffect(() => {
        const supportLauncherSelector = [
            "#bs-chatbot-widget-container_5fk7m button",
            ".website-chat-plugin_2g2r5 button",
            ".cti-chatbot-fab_8uj12",
            "._6kxvpfh1",
            ".chative-manual-launcher",
            "#bs-chatbot-widget-container_5fk7m iframe",
            ".website-chat-plugin_2g2r5 iframe",
        ].join(", ");

        const handlePointerMove = (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const hoveringSupport = !!target.closest(supportLauncherSelector);
            if (supportHoverRef.current !== hoveringSupport) {
                supportHoverRef.current = hoveringSupport;
                setIsHoveringSupportLauncher(hoveringSupport);
            }
        };

        document.addEventListener("pointermove", handlePointerMove, true);
        return () => {
            document.removeEventListener("pointermove", handlePointerMove, true);
        };
    }, []);

    const sendMessage = async () => {
        if (input.trim() === "" || loading) return;

        const userMessage = { sender: "user", text: input.trim() };
        const historyForApi = messages
            .filter((m) => m.sender === "user" || m.sender === "bot")
            .map((m) => ({
                role: m.sender === "user" ? "user" : "assistant",
                text: m.text,
            }));
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);
        try {
            const response = await postChatBot(userMessage.text, historyForApi);
            const botReply = { sender: "bot", text: response.response_data };
            setMessages((prev) => [...prev, botReply]);
        } catch (error) {
            const errorMsg =
                error.response?.data?.EM || "Lỗi không xác định, vui lòng thử lại!";
            setMessages((prev) => [...prev, { sender: "bot", text: errorMsg }]);
        } finally {
            setLoading(false);
        }
    };

    const resizeTextArea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    useEffect(() => {
        resizeTextArea();
    }, [input]);

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chatbot-container">
            {(isHoveringToggler || showAiHintNudge) && !isOpen && (
                <div className="chatbot-type-hint chatbot-type-hint--ai" role="status" aria-live="polite">
                    <strong>Chat AI </strong>
                    <p>Tư vấn tự động 24/7.</p>
                </div>
            )}
            {(isHoveringSupportLauncher || showSupportHintNudge) && !isOpen && (
                <div className="chatbot-type-hint chatbot-type-hint--support-floating" role="status" aria-live="polite">
                    <strong>Chat CSKH</strong>
                    <p>Chat trực tiếp với nhân viên hỗ trợ.</p>
                </div>
            )}

            <button
                type="button"
                className="chatbot-toggler"
                onClick={toggleChatbot}
                onMouseEnter={() => setIsHoveringToggler(true)}
                onMouseLeave={() => setIsHoveringToggler(false)}
                aria-label={isOpen ? "Đóng chat" : "Mở chat"}
            >
                {isOpen ? <FaTimes /> : <FaComments />}
            </button>

            {isOpen && (
                <div className="chatbot" role="dialog" aria-label="Hộp thoại chat">
                    <header className="chatbot-header">
                        <div className="chatbot-header__brand">
                            <span className="chatbot-header__icon" aria-hidden>
                                <FaRobot />
                            </span>
                            <div>
                                <h2 className="chatbot-header__title">Hỗ trợ trực tuyến</h2>
                                <p className="chatbot-header__subtitle">Trả lời tự động 24/7</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="chatbot-header__close"
                            onClick={toggleChatbot}
                            aria-label="Đóng"
                        >
                            <FaTimes />
                        </button>
                    </header>

                    <ul className="chatbot-messages" aria-live="polite">
                        {messages.map((msg, index) => (
                            <li
                                key={index}
                                className={`chatbot-msg chatbot-msg--${msg.sender}`}
                            >
                                {msg.sender === "bot" && (
                                    <span className="chatbot-msg__avatar" aria-hidden>
                                        <FaRobot />
                                    </span>
                                )}
                                <div className="chatbot-msg__bubble">
                                    <p className="chatbot-msg__text">{msg.text}</p>
                                </div>
                            </li>
                        ))}
                        {loading && (
                            <li className="chatbot-msg chatbot-msg--bot">
                                <span className="chatbot-msg__avatar" aria-hidden>
                                    <FaRobot />
                                </span>
                                <div className="chatbot-msg__bubble chatbot-msg__bubble--typing">
                                    <span className="chatbot-typing">
                                        <span />
                                        <span />
                                        <span />
                                    </span>
                                </div>
                            </li>
                        )}
                        <li ref={chatEndRef} className="chatbot-messages__anchor" aria-hidden />
                    </ul>

                    <footer className="chatbot-footer">
                        <div className="chatbot-composer">
                            <textarea
                                ref={textareaRef}
                                className="chatbot-composer__input"
                                placeholder="Nhập tin nhắn…"
                                rows={1}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={onKeyDown}
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="chatbot-composer__send"
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                                aria-label="Gửi"
                            >
                                <IoIosSend />
                            </button>
                        </div>
                    </footer>
                 </div>
            )}
        </div>
    );
};

export default ChatBot;

import { useEffect } from "react";

const LiveChat = () => {
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://messenger.svc.chative.io/static/v1.0/channels/s6896bae1-3e81-493e-8ecd-712aebbabe31/messenger.js?mode=livechat";
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return null;
};

export default LiveChat;

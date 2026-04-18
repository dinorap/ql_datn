import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ChatWidgetController = () => {
    const location = useLocation();

    useEffect(() => {
        const isAdminPage = location.pathname.startsWith("/admin");
        const widgetContainer = document.getElementById('bs-chatbot-widget-container_5fk7m') ||
            document.querySelector('.website-chat-plugin_2g2r5');

        if (widgetContainer) {
            if (isAdminPage) {
                widgetContainer.style.display = 'none';
                widgetContainer.style.visibility = 'hidden';
                widgetContainer.style.opacity = '0';
            } else {
                widgetContainer.style.display = 'block';
                widgetContainer.style.visibility = 'visible';
                widgetContainer.style.opacity = '1';
            }
        }

        const observer = new MutationObserver((mutations) => {
            const newWidget = document.getElementById('bs-chatbot-widget-container_5fk7m') ||
                document.querySelector('.website-chat-plugin_2g2r5');
            if (newWidget) {
                if (isAdminPage) {
                    newWidget.style.display = 'none';
                    newWidget.style.visibility = 'hidden';
                    newWidget.style.opacity = '0';
                } else {
                    newWidget.style.display = 'block';
                    newWidget.style.visibility = 'visible';
                    newWidget.style.opacity = '1';
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => {
            observer.disconnect();
        };
    }, [location.pathname]);

    return null;
};

export default ChatWidgetController;
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ChatWidgetController = () => {
    const location = useLocation();
    const userOpenedRef = useRef(false);

    useEffect(() => {
        // Mỗi lần vào/chuyển trang: luôn quay về trạng thái đóng.
        // Chỉ mở lại khi user chủ động bấm icon chat.
        userOpenedRef.current = false;
        window.sessionStorage.setItem('chative_force_closed', '1');

        const isAdminPage = location.pathname.startsWith("/admin");
        const getWidgetContainer = () =>
            document.getElementById('bs-chatbot-widget-container_5fk7m') ||
            document.querySelector('.website-chat-plugin_2g2r5');

        const getWidgetFrames = () =>
            Array.from(
                document.querySelectorAll(
                    '.bs-chatbot-widget-frame, .website-chat-plugin_2g2r5 iframe, [class*="chatbot-widget-frame"]'
                )
            );

        const getChativeIframes = () =>
            Array.from(document.querySelectorAll('iframe')).filter((iframeEl) => {
                const src = (iframeEl.getAttribute('src') || '').toLowerCase();
                const id = (iframeEl.id || '').toLowerCase();
                const cls = (iframeEl.className || '').toString().toLowerCase();
                const title = (iframeEl.getAttribute('title') || '').toLowerCase();

                return (
                    src.includes('chative') ||
                    src.includes('messenger.svc.chative.io') ||
                    id.includes('chative') ||
                    cls.includes('chative') ||
                    cls.includes('chatbot') ||
                    title.includes('chat')
                );
            });

        const parsePx = (value) => {
            const n = Number.parseFloat(value || '');
            return Number.isFinite(n) ? n : 0;
        };

        const isLargeChatFrame = (el) => {
            if (!el) return false;
            const rect = el.getBoundingClientRect();
            const width = rect.width || parsePx(el.style.width) || parsePx(el.getAttribute('width')) || 0;
            const height = rect.height || parsePx(el.style.height) || parsePx(el.getAttribute('height')) || 0;
            // Nút chat thường nhỏ (~50-80px), popup chat lớn hơn rõ rệt.
            return width >= 220 || height >= 220;
        };

        const forceHide = (el) => {
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
        };

        const forceShow = (el) => {
            el.style.setProperty('visibility', 'visible', 'important');
            el.style.setProperty('opacity', '1', 'important');
            el.style.setProperty('pointer-events', 'auto', 'important');
        };

        const applyWidgetState = () => {
            const widgetContainer = getWidgetContainer();
            const widgetFrames = getWidgetFrames();
            const chativeIframes = getChativeIframes();

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

                // Chative thường render popup trong iframe con của container.
                // Ép đóng tất cả popup iframe cho tới khi user tự bấm mở.
                const containerIframes = Array.from(widgetContainer.querySelectorAll('iframe'));
                containerIframes.forEach((iframeEl) => {
                    if (isAdminPage || !userOpenedRef.current) {
                        if (isLargeChatFrame(iframeEl)) {
                            forceHide(iframeEl);
                        }
                    } else {
                        if (isLargeChatFrame(iframeEl)) {
                            forceShow(iframeEl);
                        }
                    }
                });
            }

            // Không cho Chative tự mở modal khi vừa load trang.
            // Chỉ hiển thị modal sau khi user chủ động bấm icon chat.
            widgetFrames.forEach((widgetFrame) => {
                if (isAdminPage || !userOpenedRef.current) {
                    forceHide(widgetFrame);
                } else {
                    forceShow(widgetFrame);
                }
            });

            // Một số phiên bản Chative không dùng class cố định ở outer iframe.
            // Dùng heuristic theo kích thước để ẩn popup lớn, vẫn giữ launcher nhỏ.
            chativeIframes.forEach((iframeEl) => {
                if (isLargeChatFrame(iframeEl)) {
                    if (isAdminPage || !userOpenedRef.current) {
                        forceHide(iframeEl);
                    } else {
                        forceShow(iframeEl);
                    }
                }
            });
        };

        const markUserOpened = () => {
            userOpenedRef.current = true;
            window.sessionStorage.setItem('chative_force_closed', '0');
            window.setTimeout(() => {
                applyWidgetState();
            }, 0);
        };

        applyWidgetState();

        const handleDocumentClick = (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const clickedChativeFab = target.closest(
                '.cti-chatbot-fab_8uj12, ._6kxvpfh1, #bs-chatbot-widget-container_5fk7m button, .chative-manual-launcher'
            );

            if (clickedChativeFab) {
                markUserOpened();
            }
        };

        const handlePointerDown = (event) => {
            const target = event.target;
            if (!(target instanceof Element)) return;

            const clickedLauncherFrame =
                target.matches('iframe') &&
                !isLargeChatFrame(target) &&
                getChativeIframes().includes(target);

            const clickedInsideWidgetContainer =
                !!target.closest('#bs-chatbot-widget-container_5fk7m, .website-chat-plugin_2g2r5');

            if (clickedLauncherFrame || clickedInsideWidgetContainer) {
                markUserOpened();
            }

            // Fallback: click ở vùng góc phải dưới (nơi launcher thường hiển thị)
            // được xem là user chủ động mở chat.
            const nearRight = event.clientX >= window.innerWidth - 180;
            const nearBottom = event.clientY >= window.innerHeight - 220;
            if (nearRight && nearBottom && getChativeIframes().length > 0) {
                markUserOpened();
            }
        };

        const handleWindowBlur = () => {
            // Click vào nội dung iframe launcher thường làm window blur.
            // Nếu iframe đang active là của Chative và là iframe nhỏ -> coi là user mở chat.
            const activeEl = document.activeElement;
            if (
                activeEl instanceof HTMLIFrameElement &&
                getChativeIframes().includes(activeEl) &&
                !isLargeChatFrame(activeEl)
            ) {
                markUserOpened();
            }
        };

        document.addEventListener('click', handleDocumentClick, true);
        document.addEventListener('pointerdown', handlePointerDown, true);
        window.addEventListener('blur', handleWindowBlur);

        const observer = new MutationObserver((mutations) => {
            applyWidgetState();
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'width', 'height']
        });

        // Guard vài giây đầu để chặn auto-open trễ của script bên thứ 3.
        const guardInterval = window.setInterval(() => {
            if (!userOpenedRef.current) {
                applyWidgetState();
            }
        }, 350);
        const guardStopTimeout = window.setTimeout(() => {
            window.clearInterval(guardInterval);
        }, 12000);

        return () => {
            observer.disconnect();
            document.removeEventListener('click', handleDocumentClick, true);
            document.removeEventListener('pointerdown', handlePointerDown, true);
            window.removeEventListener('blur', handleWindowBlur);
            window.clearInterval(guardInterval);
            window.clearTimeout(guardStopTimeout);
        };
    }, [location.pathname]);

    return null;
};

export default ChatWidgetController;
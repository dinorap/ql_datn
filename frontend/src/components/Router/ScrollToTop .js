import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
    const location = useLocation();
    const prevPath = useRef(location.pathname);

    useEffect(() => {
        if (location.pathname !== prevPath.current) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            prevPath.current = location.pathname;
        }
    }, [location.pathname]);

    return null;
};

export default ScrollToTop;

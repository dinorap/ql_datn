import React, { useEffect } from 'react';
import './NotFound.scss';
import { Link } from "react-router-dom";

const NotFound = () => {
    useEffect(() => {
        const wrapper = document.querySelector('.particle-wrapper');
        if (!wrapper) return;

        const createParticle = () => {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.width = particle.style.height = `${Math.random() * 6 + 2}px`;
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDuration = Math.random() * 3 + 2 + 's';

            wrapper.appendChild(particle);
            setTimeout(() => particle.remove(), 5000);
        };

        const interval = setInterval(createParticle, 150);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="notfound-container">
            <div className="particle-wrapper"></div>
            <div className="error-code">404</div>
            <div className="message">Oops! Trang bạn tìm không tồn tại.</div>
            <Link to="/" className="back-btn">Quay lại trang chủ</Link>
        </div>
    );
};

export default NotFound;

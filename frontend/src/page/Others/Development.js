import React, { useEffect } from 'react';
import './NotFound.scss';
import { Link } from "react-router-dom";

const Development = () => {
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
        <div className="development-container">
            <div className="particle-wrapper"></div>
            <img src='https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGZlbHhhODJ2YmR0Z2M3c3ZkZG0xY2dwMnVtamhnczZ5ZWNrMTFrdiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/bGgsc5mWoryfgKBx1u/giphy.gif' alt='development'></img>
            <div className="message">Oops! Trang đang trong quá trình phát triển.</div>
            <Link to="/" className="back-btn">Quay lại trang chủ</Link>
        </div>
    );
};

export default Development;

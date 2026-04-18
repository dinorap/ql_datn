import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import './VariantImageSlider.scss';
import { LeftOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons';

import { FaRegCirclePlay } from "react-icons/fa6";

const VariantImageSlider = ({ images, video, setShow3D }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [nav1, setNav1] = useState(null);
    const [nav2, setNav2] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const sliderMainRef = useRef(null);

    const handleBeforeChange = (_, next) => setCurrentIndex(next);

    const settingsMain = {
        asNavFor: nav2,
        ref: slider => {
            setNav1(slider);
            sliderMainRef.current = slider;
        },
        slidesToShow: 1,
        swipeToSlide: true,
        arrows: false,
        beforeChange: handleBeforeChange,
        infinite: images.length > 1
    };

    const settingsThumb = {
        asNavFor: nav1,
        ref: slider => setNav2(slider),
        slidesToShow: Math.min(images.length, 6),
        swipeToSlide: true,
        focusOnSelect: true,
        arrows: true,
        nextArrow: <RightOutlined />,
        prevArrow: <LeftOutlined />,
        infinite: images.length > 6
    };

    if (!images || images.length === 0) return <div>Không có ảnh.</div>;



    return (
        <>
            <div className="gallery-container">
                <div className="main-image-wrapper">
                    {showVideo ? (
                        <div className="video-container">
                            <iframe
                                width="100%"
                                height="100%"
                                src={`${video}&autoplay=1&mute=1`}
                                title="Product video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    ) : (
                        <>
                            <button className="main-nav left" onClick={() => sliderMainRef.current?.slickPrev()}>
                                <LeftOutlined />
                            </button>
                            <Slider {...settingsMain}>
                                {images.map((img, idx) => (
                                    <div
                                        className="main-image"
                                        key={idx}
                                        onClick={() => setShowVideo(false)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img src={`${process.env.REACT_APP_BASE_URL}${img}`} alt={`Ảnh ${idx + 1}`} />
                                    </div>
                                ))}
                            </Slider>

                            <button className="main-nav right" onClick={() => sliderMainRef.current?.slickNext()}>
                                <RightOutlined />
                            </button>
                            <div className="image-count">{`${currentIndex + 1}/${images.length}`}</div>
                        </>
                    )}
                </div>

                <div className="thumb-slider-wrapper">
                    <div className="highlight-box-container">
                        <div className="highlight-box" onClick={() => { setShowVideo(false); setShow3D(true) }}>
                            <img src="/360-degrees.png" alt="Xem 360" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                    </div>
                    <div className="highlight-box-container">
                        <div className="highlight-box" onClick={() => {
                            setShowVideo(true);
                        }}>
                            <div className="icon-circle">
                                <FaRegCirclePlay />
                            </div>
                            <div className="label">Video</div>
                        </div>
                    </div>

                    <div className="thumb-slider-container">
                        <Slider {...settingsThumb} className="thumb-slider">
                            {images.map((img, idx) => (
                                <div
                                    key={idx}
                                    className={`thumb-slide ${idx === currentIndex ? 'active' : ''}`}
                                    onClick={() => {
                                        setShowVideo(false);
                                        nav1?.slickGoTo(idx);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <img src={`${process.env.REACT_APP_BASE_URL}${img}`} alt={`Thumb ${idx + 1}`} />
                                </div>
                            ))}
                        </Slider>
                    </div>
                </div>

            </div>

        </>
    );
};

export default VariantImageSlider;

import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { FaFacebook } from "react-icons/fa";
import { FaGithub } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { FaHome } from "react-icons/fa";
import { FaRegNewspaper } from "react-icons/fa6";
import { FaRegHandshake } from "react-icons/fa";
import { IoIosInformationCircle } from "react-icons/io";
import { FaWrench } from "react-icons/fa";
import { IoCall } from "react-icons/io5";
import './HeaderFooter.scss'
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import logo from '../../assets/Logo/logo.png';
import { FaShoppingCart, FaUser, FaSearch, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useSelector } from 'react-redux';
import { postLogOut } from "../../services/apiService";
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { useDispatch } from "react-redux";
import Slider from "react-slick";
import { toast } from "react-toastify";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { animateScroll } from 'react-scroll';
import { FaArrowUp } from "react-icons/fa";
import { logout } from "../../redux/slices/userSlice";
import { getAdvertise } from "../../services/apiAdvertise";
import { getAllProductSpecifications, searchSuggestions } from "../../services/apiViewService";
import { IoLogoYoutube } from "react-icons/io5";
import { useTranslation } from 'react-i18next';
import '../../locales/i18n.js';

/** Thứ tự menu cột trái */
const CATEGORY_MENU_ITEMS = [
    {
        matchLabel: 'Điện thoại',
        titleKey: 'menu_phone',
        icon: 'https://cdn.tgdd.vn//content/icon-phone-96x96-2.png',
    },
    {
        matchLabel: 'Laptop',
        titleKey: 'menu_laptop',
        icon: 'https://cdn.tgdd.vn//content/icon-laptop-96x96-1.png',
    },
    {
        matchLabel: 'Máy tính bảng',
        titleKey: 'menu_tablet',
        icon: 'https://cdn.tgdd.vn//content/icon-tablet-96x96-1.png',
    },
    {
        matchLabel: 'Phụ kiện',
        titleKey: 'menu_accessories',
        icon: 'https://cdn.tgdd.vn//content/icon-phu-kien-96x96-1.png',
    },
    {
        matchLabel: 'Smartwatch',
        titleKey: 'menu_smartwatch',
        icon: 'https://cdn.tgdd.vn//content/icon-smartwatch-96x96-1.png',
    },
    {
        matchLabel: 'Đồng hồ',
        titleKey: 'menu_watch',
        icon: 'https://cdn.tgdd.vn//content/watch-icon-96x96.png',
    },
    {
        matchLabel: 'Máy cũ, Thu cũ',
        titleKey: 'menu_old_tradein',
        icon: 'https://cdn.tgdd.vn//content/icon-header-may-cu-30x30.png',
    },
    {
        matchLabel: 'PC, Máy in',
        titleKey: 'menu_pc_printer',
        icon: 'https://cdn.tgdd.vn//content/icon-pc-96x96.png',
    },
    {
        matchLabel: 'Dịch vụ',
        titleKey: 'menu_services',
        icon: 'https://cdn.tgdd.vn//content/icon-pc-96x96.png',
    },
];

const slugifyCategoryLabel = (str) =>
    str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '');

/** Tách tiêu đề / dòng phụ từ tên banner (vd: "A | B" hoặc "A / B") */
const splitBannerTabLines = (raw) => {
    const s = raw?.trim() || '';
    const delims = [' | ', ' / ', ' – ', ' — '];
    for (const d of delims) {
        const i = s.indexOf(d);
        if (i !== -1) {
            return {
                title: s.slice(0, i).trim() || s,
                hint: s.slice(i + d.length).trim() || 'Chi tiết',
            };
        }
    }
    return { title: s || 'Banner', hint: 'Xem chi tiết' };
};

const BannerSlider = () => {
    const sliderRef = useRef(null);
    const tabsScrollRef = useRef(null);
    const tabBtnRefs = useRef([]);
    const [banners, setBanner] = useState([]);
    const [thumbBanners, setThumbBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const [tabScrollPrev, setTabScrollPrev] = useState(false);
    const [tabScrollNext, setTabScrollNext] = useState(false);

    const slideCount = banners.length;

    const refreshTabScrollArrows = useCallback(() => {
        const el = tabsScrollRef.current;
        if (!el) {
            setTabScrollPrev(false);
            setTabScrollNext(false);
            return;
        }
        const max = el.scrollWidth - el.clientWidth;
        if (max <= 4) {
            setTabScrollPrev(false);
            setTabScrollNext(false);
            return;
        }
        setTabScrollPrev(el.scrollLeft > 4);
        setTabScrollNext(el.scrollLeft < max - 4);
    }, []);

    const scrollTabsByArrow = useCallback(
        (dir) => {
            const el = tabsScrollRef.current;
            if (!el) return;
            const step = el.clientWidth;
            el.scrollBy({ left: dir * step, behavior: 'smooth' });
            window.setTimeout(refreshTabScrollArrows, 350);
        },
        [refreshTabScrollArrows]
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const main = await getAdvertise(0);
                if (main?.EC === 0 && Array.isArray(main.data)) {
                    setBanner(main.data);
                } else {
                    setBanner([]);
                }
                const thumbs = await getAdvertise(2);
                if (thumbs?.EC === 0 && Array.isArray(thumbs.data)) {
                    setThumbBanners(thumbs.data);
                } else {
                    setThumbBanners([]);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useLayoutEffect(() => {
        refreshTabScrollArrows();
    }, [banners, refreshTabScrollArrows]);

    useEffect(() => {
        const el = tabsScrollRef.current;
        if (!el) return;
        const onScroll = () => refreshTabScrollArrows();
        el.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', refreshTabScrollArrows);
        return () => {
            el.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', refreshTabScrollArrows);
        };
    }, [banners.length, refreshTabScrollArrows]);

    useEffect(() => {
        const container = tabsScrollRef.current;
        const tab = tabBtnRefs.current[activeIndex];
        if (!container || !tab) {
            const t0 = window.setTimeout(refreshTabScrollArrows, 0);
            return () => window.clearTimeout(t0);
        }
        let didScroll = false;
        // Chỉ cuộn trong thanh tab — không dùng scrollIntoView (nó cuộn cả window,
        // kéo trang lên đầu khi user đang ở cuối trang mỗi lần autoplay đổi slide).
        const cRect = container.getBoundingClientRect();
        const tRect = tab.getBoundingClientRect();
        const pad = 8;
        const overflowLeft = tRect.left - cRect.left - pad;
        const overflowRight = tRect.right - cRect.right + pad;
        if (overflowLeft < 0) {
            didScroll = true;
            container.scrollBy({ left: overflowLeft, behavior: 'smooth' });
        } else if (overflowRight > 0) {
            didScroll = true;
            container.scrollBy({ left: overflowRight, behavior: 'smooth' });
        }
        const delay = didScroll ? 400 : 0;
        const t = window.setTimeout(refreshTabScrollArrows, delay);
        return () => window.clearTimeout(t);
    }, [activeIndex, refreshTabScrollArrows]);

    const goToSlide = (idx) => {
        const safe = Math.max(0, Math.min(idx, Math.max(0, slideCount - 1)));
        setActiveIndex(safe);
        sliderRef.current?.slickGoTo(safe);
    };

    const goToTab = (tabIdx) => {
        goToSlide(Math.min(tabIdx, Math.max(0, slideCount - 1)));
    };

    const settings = useMemo(
        () => ({
            dots: true,
            arrows: true,
            infinite: slideCount > 1,
            slidesToShow: 1,
            speed: 500,
            slidesToScroll: 1,
            autoplay: slideCount > 1,
            autoplaySpeed: 4000,
            afterChange: (current) => setActiveIndex(current),
        }),
        [slideCount]
    );

    if (loading) return <div className="hero-banner-slider-wrap" />;
    if (error) return <div className="hero-banner-slider-wrap" />;
    if (!slideCount) return <div className="hero-banner-slider-wrap" />;

    const baseUrl = process.env.REACT_APP_BASE_URL || '';
    const thumbSlides = thumbBanners.slice(0, 3);

    return (
        <div className="hero-banner-slider-wrap">
            <div className="hero-promo-tabs-strip">
                <button
                    type="button"
                    className="hero-promo-tabs-arrow hero-promo-tabs-arrow--prev"
                    aria-label="Cuộn tab sang trái"
                    disabled={!tabScrollPrev}
                    onClick={() => scrollTabsByArrow(-1)}
                >
                    <FaChevronLeft />
                </button>
                <div
                    ref={tabsScrollRef}
                    className="hero-promo-tabs"
                    role="tablist"
                    aria-label="Chọn banner"
                >
                    {banners.map((b, idx) => {
                        const { title, hint } = splitBannerTabLines(b.name);
                        return (
                            <button
                                key={b.id ?? idx}
                                ref={(el) => {
                                    tabBtnRefs.current[idx] = el;
                                }}
                                type="button"
                                role="tab"
                                aria-selected={activeIndex === idx}
                                className={`hero-promo-tab${activeIndex === idx ? ' active' : ''}`}
                                onClick={() => goToTab(idx)}
                            >
                                <div className="tab-title">{title}</div>
                                <div className="tab-hint">{hint}</div>
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    className="hero-promo-tabs-arrow hero-promo-tabs-arrow--next"
                    aria-label="Cuộn tab sang phải"
                    disabled={!tabScrollNext}
                    onClick={() => scrollTabsByArrow(1)}
                >
                    <FaChevronRight />
                </button>
            </div>
            <div className="slider-container">
                <Slider ref={sliderRef} {...settings}>
                    {banners.map((imgSrc, index) => (
                        <div className="slider-item" key={imgSrc.id ?? index}>
                            <div className="hero-slide-frame">
                                <a
                                    href={imgSrc.link || '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hero-slide-link"
                                >
                                    <img
                                        src={`${baseUrl}${imgSrc.image}`}
                                        alt={imgSrc.name || `banner-${index}`}
                                        className="hero-slide-img"
                                    />
                                </a>
                            </div>
                        </div>
                    ))}
                </Slider>
            </div>
            {thumbSlides.length > 0 && (
                <div className="hero-slider-thumbs" aria-hidden="true">
                    {thumbSlides.map((b, idx) => (
                        <div key={b.id ?? idx} className="hero-thumb-tile">
                            <div className="hero-thumb-frame">
                                <img
                                    src={`${baseUrl}${b.image}`}
                                    alt=""
                                    loading="lazy"
                                    className="hero-thumb-img"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const Banner = () => {
    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        slidesToShow: 1, slidesToScroll: 1,
        autoplay: true, autoplaySpeed: 3000
    };

    const [banners, setBanner] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getAdvertise(1);
                setBanner(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading || error || banners.length === 0) return null;

    return (
        banners.length > 1 ? (
            <Slider {...settings} className="single-item">
                {banners.map((imgSrc, index) => (
                    <div className="slider-item banner" key={index}>
                        <img
                            src={`${process.env.REACT_APP_BASE_URL}${imgSrc.image}`}
                            alt={`banner-${index}`}
                            className="banner-small"

                        />
                    </div>
                ))}
            </Slider>
        ) : (
            <div className="banner">
                <img
                    src={`${process.env.REACT_APP_BASE_URL}${banners[0].image}`}
                    alt="banner"
                    className="banner-small"

                />
            </div>
        )
    );

};

const TopNav = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language || 'vi';
    return (
        <div className="top-nav-bar">
            <Navbar expand="lg" className="bg-body-tertiary" >
                <Container className="d-flex justify-content-between align-items-center max-with">

                    <div className="social-icons" style={{ display: 'flex', alignItems: 'center' }}>
                        <a href="https://www.facebook.com/" className="me-3" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2', fontSize: '18px' }}>
                            <FaFacebook />
                        </a>
                        <a href="https://github.com/" className="me-3 text-dark" target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px' }}>
                            <FaGithub />
                        </a>
                        <a href="https://www.google.com.vn/" className="me-3" target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px' }}>
                            <FcGoogle />
                        </a>
                        <a href="https://www.youtube.com/" className="text-danger" target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px' }}>
                            <FaYoutube />
                        </a>
                    </div>

                    <div className="top-nav-bar-right d-flex justify-content-center" style={{ flexGrow: 1 }}>
                        <Nav className="mx-auto" style={{ flexWrap: 'nowrap' }}>
                            <NavLink className="nav-link" to="/" >
                                <FaHome /> {t('home')}
                            </NavLink>
                            <NavLink className="nav-link" to="/tintuc">
                                <FaRegNewspaper /> {t('news')}
                            </NavLink>
                            <NavLink className="nav-link" to="/tuyendung" >
                                <FaRegHandshake /> {t('recruitment')}
                            </NavLink>
                            <NavLink className="nav-link" to="/lienhe" >
                                <IoIosInformationCircle /> Thêm thông tin
                            </NavLink>
                        </Nav>
                    </div>

                    <div className="language-switch d-flex justify-content-end" style={{ width: '120px' }}>
                        <button
                            onClick={() => i18n.changeLanguage('vi')}
                            className={`btn btn-sm me-1 ${currentLang === 'vi' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            style={{ borderRadius: '15px', padding: '2px 10px', fontSize: '12px', fontWeight: 'bold' }}
                        >
                            VI
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            className={`btn btn-sm ${currentLang === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            style={{ borderRadius: '15px', padding: '2px 10px', fontSize: '12px', fontWeight: 'bold' }}
                        >
                            EN
                        </button>
                    </div>

                </Container>
            </Navbar>
        </div>
    );
}

const Header = () => {
    const { t } = useTranslation();
    const isAuthenticated = useSelector(state => state.user.isAuthenticated);
    const account = useSelector(state => state.user.account);
    const count = useSelector(state => state.user.cartCount);

    const [showPopover, setShowPopover] = useState(false);
    const [searchParams] = useSearchParams();
    const targetRef = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const handleLogin = () => {
        navigate('/login');
    };

    const handleCart = () => {
        navigate('/cart');
    };

    const handleLogout = async () => {
        let data = await postLogOut();
        if (data && data.EC === 0) {
            toast.success(data.EM);
            dispatch(logout());
            navigate("/");
        }
        else {
            toast.error(data.EM);
        }

    };

    const profilePopover = (
        <Popover
            id="popover-profile"
            onMouseEnter={() => setShowPopover(true)}
            onMouseLeave={() => setShowPopover(false)}
        >
            <Popover.Body>
                <Button variant="link" className="w-100 text-start" onClick={() => navigate('/thongtin')}>
                    {t('profile')}
                </Button>
                <Button variant="link" className="w-100 text-start" onClick={handleLogout}>
                    {t('logout')}
                </Button>
            </Popover.Body>
        </Popover>
    );
    useEffect(() => {
        const currentKeyword = searchParams.get("keyword");
        if (currentKeyword) {
            setKeyword(currentKeyword);
        }
    }, [searchParams]);

    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState({ names: [], products: [] });
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSearch = async (e) => {
        const value = e.target.value;
        setKeyword(value);

        if (value.trim() !== '') {
            const res = await searchSuggestions(value);
            if (res?.EC === 0) {
                setSuggestions(res.data);
                setShowSuggestions(true);
            }
        } else {
            setSuggestions({ names: [], products: [] });
            setShowSuggestions(false);
        }
    };

    const submitSearch = (customKeyword) => {
        const keywordToSearch = customKeyword ?? keyword;

        navigate(`/search?keyword=${encodeURIComponent(keywordToSearch.trim())}`);
        setShowSuggestions(false);
    };





    return (

        <div className="header">
            <Navbar expand="lg" className="bg-body-tertiary">
                <Container className="d-flex justify-content-between align-items-center max-with-header">

                    <div className="logo-user">
                        <Navbar.Brand onClick={() => { navigate('/'); setKeyword(""); }} >
                            <img src={logo} alt="Logo" />
                        </Navbar.Brand>
                    </div>


                    <div className="home-search-item mx-auto" style={{ position: 'relative' }}>
                        <Form className="d-flex">
                            <Form.Control
                                type="search"
                                placeholder={t('search-key')}
                                className="input-search"
                                aria-label="Search"
                                value={keyword}
                                onChange={handleSearch}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault(); submitSearch();
                                    }
                                }}
                            />
                            <Button className="button-search" onClick={() => submitSearch()}>
                                <FaSearch /> {t('search')}
                            </Button>

                        </Form>


                        {showSuggestions && (suggestions.names.length > 0 || suggestions.products.length > 0) && (
                            <div className="suggestions-box" >
                                {suggestions.names.length > 0 && (
                                    <>
                                        <div className="title"><strong>Từ khóa gợi ý</strong></div>
                                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                            {suggestions.names.map((name, idx) => (
                                                <li key={idx} onClick={() => {
                                                    setKeyword(name); submitSearch(name)
                                                }}>
                                                    {name}
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                                {suggestions.products.length > 0 && (
                                    <>
                                        <div className="title"><strong>Sản phẩm gợi ý</strong></div>
                                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                                            {suggestions.products.map((product) => (
                                                <li className="suggestion-item" key={product.product_id} onClick={() => {
                                                    navigate(`/products/${product.product_id}`);
                                                    setShowSuggestions(false);
                                                }}>

                                                    <div className="suggestion-img">
                                                        <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                                    </div>
                                                    <div className="suggestion-info">
                                                        <p className="product_name">{product.product_name}</p>
                                                        {product.promotion ? <p className="product_promotion">{product.promotion.promotion_type_name}</p> : ""}
                                                        <div className="cost">
                                                            <span className="product_final" >{product.final_price.toLocaleString()}₫ </span>
                                                            {product.promotion ? <span className="product_base"> {product.base_price.toLocaleString()}₫</span> : ""}
                                                        </div>


                                                    </div>

                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}
                    </div>


                    <div className="d-flex ms-auto home-button">
                        {isAuthenticated ? (
                            <>
                                <OverlayTrigger
                                    trigger="click"
                                    placement="bottom"
                                    overlay={profilePopover}
                                    show={showPopover}
                                >
                                    <div
                                        ref={targetRef}
                                        className="profile-name"
                                        onMouseEnter={() => setShowPopover(true)}
                                        onMouseLeave={() => setShowPopover(false)}
                                    >
                                        <div className="avatar-container" style={{ marginRight: '0px' }}>
                                            <img
                                                src={account.avatar ? `${account.avatar}` : "/avatar.png"}
                                                alt="User Avatar"
                                                style={{
                                                    width: '55px',
                                                    height: '55px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                        </div> {account.username}
                                    </div>
                                </OverlayTrigger>
                                <Button variant="outline-secondary" className="button-cart" onClick={handleCart} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                                    <div style={{ position: 'relative' }}>
                                        <FaShoppingCart />
                                        {count > 0 && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: '-11px',
                                                    right: '-13px',
                                                    background: '#d70018',
                                                    color: '#fff',
                                                    borderRadius: '50%',
                                                    minWidth: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    zIndex: 2,
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                                }}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                    {t('cart')}
                                </Button>

                            </>
                        ) : (
                            <>
                                <Button variant="outline-primary" className="me-2 button-login" onClick={handleLogin}>
                                    <FaUser /> {t('login')}
                                </Button>
                                <Button variant="outline-secondary" className="button-cart" onClick={handleCart} style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
                                    <div style={{ position: 'relative' }}>
                                        <FaShoppingCart />
                                        {count > 0 && (
                                            <span
                                                style={{
                                                    position: 'absolute',
                                                    top: '-11px',
                                                    right: '-13px',
                                                    background: '#d70018',
                                                    color: '#fff',
                                                    borderRadius: '50%',
                                                    minWidth: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    zIndex: 2,
                                                    border: '2px solid #fff',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                                                }}
                                            >
                                                {count}
                                            </span>
                                        )}
                                    </div>
                                    {t('cart')}
                                </Button>

                            </>
                        )}
                    </div>
                </Container>
            </Navbar>
        </div>
    );
};


const Category = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [filterAll, setFilterAll] = useState(null);

    useEffect(() => {
        const fetchFilter = async () => {
            const res = await getAllProductSpecifications();
            if (res?.EC === 0) setFilterAll(res.data);
        };
        fetchFilter();
    }, []);

    const handleNavClick = (label) => {
        if (!filterAll?.category) return;

        const matched = filterAll.category.find(
            (cat) => slugifyCategoryLabel(cat.label) === slugifyCategoryLabel(label)
        );

        if (!matched) return;

        const category_id = matched.value;
        const slug = slugifyCategoryLabel(label);
        navigate(`sanpham/${slug}?category_id=${category_id}`);
    };

    return (
        <div className="category-menu">
            <Nav className="main-menu">
                {CATEGORY_MENU_ITEMS.map((item) => (
                    <div key={item.matchLabel} className="nav-item" onClick={() => handleNavClick(item.matchLabel)}>
                        <img src={item.icon} alt="" /> {t(item.titleKey)}
                    </div>
                ))}
            </Nav>
        </div>
    );
};





const CoolPage = () => {

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 99) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToTop = () => {
        animateScroll.scrollToTop({
            duration: 0,
            smooth: true,
        });
    };

    return (
        <button
            onClick={scrollToTop}
            style={{
                position: "fixed",
                left: "50px",
                bottom: "20px",
                borderRadius: "50%",
                backgroundColor: "white",
                boxShadow: "0px 2px 4px 1px rgba(0, 0, 0, 0.08)",
                width: "50px",
                height: "50px",
                display: isVisible ? "flex" : "none",
                justifyContent: "center",
                alignItems: "center",
                transition: "opacity 0.3s ease-in-out",
                border: "1px solid var(--neutral-gray-3)",
                cursor: "pointer",
                zIndex: "1000",
                color: "rgb(70, 70, 70)",
                fontSize: "20px"

            }}

        >
            <FaArrowUp />
        </button >
    );
};


const Footer = () => {
    const { t } = useTranslation();
    return (
        <footer className="footer">
            <div className="footer__features">
                <div className="container">
                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon">

                                <img src="/svg/policy3.svg" alt="ok"></img>

                            </div>
                            <div className="feature-text">
                                <h4>{t('brand_guarantee')}</h4>
                                <p>{t('brand_description')}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <img src="/svg/policy4.svg" alt="ok"></img>
                            </div>
                            <div className="feature-text">

                                <h4>{t('easy_return')}</h4>
                                <p>{t('easy_return_desc')}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <img src="/svg/policy2.svg" alt="ok"></img>
                            </div>
                            <div className="feature-text">
                                <h4>{t('quality_products')}</h4>
                                <p>{t('quality_desc')}</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">
                                <img src="/svg/policy1.svg" alt="ok"></img>
                            </div>
                            <div className="feature-text">
                                <h4>{t('delivery')}</h4>
                                <p>{t('delivery_desc')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="footer__main">
                <div className="container">

                    <div className="footer__middle">
                        <div className="footer__col">
                            <h4>{t('connect_us')}</h4>
                            <div className="social-links">
                                <a href="https://www.facebook.com/" className="me-3" target="_blank" rel="noopener noreferrer">
                                    <FaFacebook className="contact" />
                                </a>
                                <a href="https://github.com/" className="me-3 text-dark" target="_blank" rel="noopener noreferrer">
                                    <FaGithub className="contact" />
                                </a>
                                <a href="https://www.google.com.vn/" className="me-3" target="_blank" rel="noopener noreferrer">
                                    <FcGoogle className="contact" />
                                </a>
                                <a href="https://www.youtube.com/" className="me-3 text-danger" target="_blank" rel="noopener noreferrer">
                                    <FaYoutube className="contact" />
                                </a>
                            </div>

                            <h4 className="mt-4">{t('hotline')}</h4>
                            <div className="contact-info">
                                <p>{t('consultation')}</p>
                                <p><strong>1000.0000</strong> (Nhánh 1)</p>
                                <p>{t('feedback')}</p>
                                <p><strong>1111.1111</strong> (8h00 - 22h00)</p>
                            </div>
                        </div>

                        <div className="footer__col">
                            <h4>{t('about_us')}</h4>
                            <ul className="footer-links">
                                <li><a href="#">{t('our_company')}</a></li>
                                <li><a href="#">{t('rules')}</a></li>
                                <li><a href="#">{t('enterprise_project')}</a></li>
                                <li><a href="#">{t('promo_news')}</a></li>
                                <li><a href="#">{t('used_devices')}</a></li>
                                <li><a href="#">{t('guide_payment')}</a></li>
                                <li><a href="#">{t('apple_warranty')}</a></li>
                                <li><a href="#">{t('invoice_lookup')}</a></li>
                                <li><a href="#">{t('warranty_lookup')}</a></li>
                                <li><a href="#">{t('faq')}</a></li>
                            </ul>
                        </div>

                        <div className="footer__col">
                            <h4>{t('policy')}</h4>
                            <ul className="footer-links">
                                <li><a href="#">{t('warranty_policy')}</a></li>
                                <li><a href="#">{t('return_policy')}</a></li>
                                <li><a href="#">{t('privacy_policy')}</a></li>
                                <li><a href="#">{t('installment_policy')}</a></li>
                                <li><a href="#">{t('unbox_policy')}</a></li>
                                <li><a href="#">{t('shipping_policy')}</a></li>
                                <li><a href="#">{t('mobile_policy')}</a></li>
                                <li><a href="#">{t('data_policy')}</a></li>
                                <li><a href="#">{t('support_policy')}</a></li>
                                <li><a href="#">{t('appliance_policy')}</a></li>
                            </ul>
                        </div>


                        <div className="footer__col">
                            <h4>{t('payment_support')}</h4>
                            <div className="payment-methods">
                                <div className="payment-row">
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                </div>

                                <div className="payment-row">
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon1.svg" alt="Momo" />
                                    </div>
                                </div>

                                <div className="payment-row">
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                </div>

                                <div className="payment-row">
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                    <div className="payment-item">
                                        <img src="./momo_icon.svg" alt="Momo" />
                                    </div>
                                </div>
                            </div>


                        </div>
                    </div>
                </div>
            </div>

            <div className="footer__bottom">
                <div className="container">
                    <div className="copy-right">
                        <p>
                            <NavLink className="nav-link" to="/" >{t('copyright')} &nbsp;</NavLink> - All rights reserved © 2026 - Designed by&nbsp;
                            <span style={{ color: "#eee", fontWeight: "bold" }}>Nguyễn Quang Linh</span>
                        </p>
                    </div>
                    <p>{t("phone-num")}: 012 3456 789. Email: abc@st.phenikaa-uni.edu.vn.</p>
                </div>
            </div>
        </footer>
    );
};

export { Header, Footer, TopNav, Category, BannerSlider, Banner, CoolPage }
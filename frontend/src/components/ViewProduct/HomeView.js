import React, { useEffect, useState } from 'react';
import Slider from 'react-slick';
import { Rate, Tag } from 'antd';
import { getFlashSaleProducts, getSimilarProducts, getSuggestCart, getTopProductsByCategory, postSuggestCart } from '../../services/apiViewService';
import { getAdvertise } from '../../services/apiAdvertise';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './HomeView.scss'
import { Link } from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";
import { NavLink, useNavigate } from "react-router-dom";
import { getAllRecentlyViewed, getSuggestRecenttly } from '../../services/apiRecentlyViewed';
import { useSelector } from 'react-redux';
import { getCart } from '../../services/apiCartService';
const FlashSaleSlider = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await getFlashSaleProducts();
            if (res?.EC === 0) {
                setProducts(res.data);

            }
        };
        fetchProducts();
    }, []);

    const settings = {
        dots: false,
        infinite: false,

        slidesToShow: 5,
        slidesToScroll: 1,
    };
    const navigate = useNavigate();
    return (
        products && (

            < div className="flash-sale-section weekend-sale" >
                <div className="weekend-sale-shell">
                    < div className="flash-sale-header" >
                        <img src="/Banner_deal.webp" alt="Hot sale cuối tuần" />
                    </div >
                    <div className="flash-sale-frame">
                        <Slider {...settings}>
                        {products.map((product) => (
                            <div key={product.product_id} className="flash-sale-item">
                                {product.is_active === 0 && (
                                    <div className="overlay-disabled-1">
                                        <div className="overlay-disabled">
                                            <p>Ngừng bán</p></div>
                                    </div>
                                )}
                                <div className="discount-badge"><p className='promotion-name'>{product.promotion.promotion_type_name}</p></div>
                                {product.is_installment_available === 1 ? <div className="installment">Trả góp 0%</div> : ""}

                                <div className="flash-sale-card">
                                    <div className="flash-sale-image" onClick={() => navigate(`/products/${product.product_id}`)} >
                                        {
                                            product.image ? (
                                                <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                            ) : (
                                                <div className="no-image">No Image</div>
                                            )
                                        }

                                    </div>
                                    <div className="flash-sale-content">
                                        <h3 className="product-name" onClick={() => navigate(`/products/${product.product_id}`)}>{product.product_name}</h3>
                                        {product.ram && product.rom && (
                                            <Tag className='option-tag'>{product.ram} / {product.rom}</Tag>
                                        )}
                                        {product.screen && (
                                            <Tag className='option-tag'>{product.screen}"</Tag>
                                        )}
                                        {product.refresh_rate && (
                                            <Tag className='option-tag'>{product.refresh_rate}</Tag>
                                        )}
                                        <div className="price-section">
                                            {product.promotion.promotion_code === 'custom_price' ? (
                                                <>
                                                    <p className="final-price">{product.final_price.toLocaleString()}₫ - Giá HOT</p>
                                                    <span className="base-price">{product.base_price.toLocaleString()}₫</span>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="final-price">{product.final_price.toLocaleString()}₫</p>
                                                    <div>
                                                        <span className="base-price">{product.base_price.toLocaleString()}₫</span>
                                                        <span className="discount">
                                                            - {product.promotion.discount_value.toLocaleString()}
                                                            {product.promotion.promotion_code === 'fixed_amount' ? '₫' : '%'}
                                                        </span>
                                                    </div>
                                                </>
                                            )}

                                        </div>
                                        <div className="rating-section">
                                            <Rate disabled defaultValue={product.average_rating} className="rating" />
                                            <span className="reviews">{product.total_reviews} đánh giá</span>
                                        </div>
                                        <div className="description">
                                            <p className="description-p">{product.description}</p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))
                        }
                        </Slider >
                    </div>
                </div>
            </div >)
    );
};

const TopProductSection = ({ categoryId, title, background, link, sideBannerType }) => {
    const [products, setProducts] = useState([]);
    const [sideAd, setSideAd] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const fetchProducts = async () => {
            const res = await getTopProductsByCategory(categoryId);
            if (res?.EC === 0) {
                setProducts(res.data);
            }
        };
        fetchProducts();
    }, [categoryId]);

    useEffect(() => {
        const bannerType = Number(sideBannerType);
        if (!Number.isFinite(bannerType) || bannerType < 0) {
            setSideAd(null);
            return;
        }
        let cancelled = false;
        (async () => {
            const res = await getAdvertise(bannerType);
            if (cancelled) return;
            const first = res?.EC === 0 && Array.isArray(res.data) ? res.data[0] : null;
            setSideAd(first?.image ? first : null);
        })();
        return () => { cancelled = true; };
    }, [sideBannerType]);

    const link_k = link + "?category_id=" + categoryId;
    const hasSideBanner = Boolean(sideAd?.image);
    const sideHref = sideAd?.link && sideAd.link !== '#' ? sideAd.link : null;
    const sideIsExternal = sideHref && /^https?:\/\//i.test(sideHref);

    return (
        <div className='home'>
            <div className={`top-item-section${hasSideBanner ? ' top-item-section--with-side' : ''}`}>
                <div className={`title-top-item ${background}`}>{title}</div>
                <div className="top-item-body">
                    {hasSideBanner && (
                        <a
                            className="top-item-side-banner"
                            href={sideHref || '#'}
                            onClick={(e) => {
                                if (!sideHref) e.preventDefault();
                            }}
                            {...(sideIsExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        >
                            <img
                                src={`${process.env.REACT_APP_BASE_URL}${sideAd.image}`}
                                alt={sideAd.name || 'Quảng cáo'}
                            />
                        </a>
                    )}
                    <div className='list-top-item'>
                    {products.map((product) => (
                        <div key={product.product_id} className="flash-sale-item top ">
                            {product.is_active === 0 && (
                                <div className="overlay-disabled-1">
                                    <div className="overlay-disabled">
                                        <p>Ngừng bán</p></div>
                                </div>
                            )}

                            {product.promotion && (
                                <div className="discount-badge">
                                    <p className='promotion-name'>{product.promotion.promotion_type_name}</p>
                                </div>
                            )}
                            {product.is_installment_available === 1 && (
                                <div className="installment">Trả góp 0%</div>
                            )}
                            <div className="flash-sale-card">
                                <div className="flash-sale-image" onClick={() => navigate(`/products/${product.product_id}`)}>
                                    {product.image ? (
                                        <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                    ) : (
                                        <div className="no-image">No Image</div>
                                    )}
                                </div>
                                <div className="flash-sale-content">
                                    <h3 className="product-name" onClick={() => navigate(`/products/${product.product_id}`)}>{product.product_name}</h3>
                                    {product.ram && product.rom && (
                                        <Tag className='option-tag'>{product.ram} / {product.rom}</Tag>
                                    )}
                                    {product.screen && (
                                        <Tag className='option-tag'>{product.screen}"</Tag>
                                    )}
                                    {product.refresh_rate && (
                                        <Tag className='option-tag'>{product.refresh_rate}</Tag>
                                    )}
                                    <div className="price-section">
                                        <p className="final-price">
                                            {product.final_price.toLocaleString()}₫
                                            {product.promotion?.promotion_code === 'custom_price' && ' - Giá Sốc'}
                                        </p>
                                        {product.promotion && product.promotion.promotion_code !== 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product.base_price.toLocaleString()}₫</span>
                                                <span className="discount">
                                                    - {product.promotion.discount_value.toLocaleString()}
                                                    {product.promotion.promotion_code === 'fixed_amount' ? '₫' : '%'}
                                                </span>
                                            </div>
                                        )}
                                        {product.promotion && product.promotion.promotion_code === 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product.base_price.toLocaleString()}₫</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rating-section">
                                        <Rate disabled defaultValue={product.average_rating} className="rating" />
                                        <span className="reviews">{product.total_reviews} đánh giá</span>
                                    </div>
                                    <div className="description">
                                        <p className="description-p">{product.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
                <div className="see-more">
                    <Link to={link_k}>Xem thêm {title.toLowerCase()} <IoIosArrowDown />  </Link>
                </div>
            </div>
        </div>
    );
};


const SuggestionSlider = ({ id }) => {

    const [products, setProducts] = useState([]);

    useEffect(() => {

        const fetchProducts = async () => {
            const res = await getSimilarProducts(id);
            if (res?.EC === 0) {
                setProducts(res.data);
            }
        };
        fetchProducts();
    }, [id]);

    const settings = {
        dots: false,
        infinite: false,
        swipe: true,
        swipeToSlide: true,
        slidesToShow: 5,
        slidesToScroll: 1,
    };
    const navigate = useNavigate();
    return (
        products && (

            < div className="flash-sale-section color-sugges" >
                <div className='title-suggest'>
                    <b>Sản phẩm tương tự</b>
                </div>
                <Slider {...settings}>
                    {products.map((product) => (
                        <div key={product.product_id} className="flash-sale-item top ">
                            {product.is_active === 0 && (
                                <div className="overlay-disabled-1">
                                    <div className="overlay-disabled">
                                        <p>Ngừng bán</p></div>
                                </div>
                            )}

                            {product.promotion && (
                                <div className="discount-badge">
                                    <p className='promotion-name'>{product.promotion.promotion_type_name}</p>
                                </div>
                            )}
                            {product.is_installment_available === 1 && (
                                <div className="installment">Trả góp 0%</div>
                            )}
                            <div className="flash-sale-card">
                                <div className="flash-sale-image" onClick={() => navigate(`/products/${product.product_id}`)}>
                                    {product.image ? (
                                        <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                    ) : (
                                        <div className="no-image">No Image</div>
                                    )}
                                </div>
                                <div className="flash-sale-content">
                                    <h3 className="product-name" onClick={() => navigate(`/products/${product.product_id}`)}>{product.product_name}</h3>
                                    {product.ram && product.rom && (
                                        <Tag className='option-tag'>{product.ram} / {product.rom}</Tag>
                                    )}
                                    {product.screen && (
                                        <Tag className='option-tag'>{product.screen}"</Tag>
                                    )}
                                    {product.refresh_rate && (
                                        <Tag className='option-tag'>{product.refresh_rate}</Tag>
                                    )}
                                    <div className="price-section">
                                        <p className="final-price">
                                            {product.final_price.toLocaleString()}₫
                                            {product.promotion?.promotion_code === 'custom_price' && ' - Giá Sốc'}
                                        </p>
                                        {product.promotion && product.promotion.promotion_code !== 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product.base_price.toLocaleString()}₫</span>
                                                <span className="discount">
                                                    - {product.promotion.discount_value.toLocaleString()}
                                                    {product.promotion.promotion_code === 'fixed_amount' ? '₫' : '%'}
                                                </span>
                                            </div>
                                        )}
                                        {product.promotion && product.promotion.promotion_code === 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product.base_price.toLocaleString()}₫</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rating-section">
                                        <Rate disabled defaultValue={product.average_rating} className="rating" />
                                        <span className="reviews">{product.total_reviews} đánh giá</span>
                                    </div>
                                    <div className="description">
                                        <p className="description-p">{product.description}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </Slider >
            </div >)
    );
};


const CurrentlyViewedSlider = () => {
    const account = useSelector(state => state.user.account);
    const [products, setProducts] = useState([]);


    useEffect(() => {
        const fetchProducts = async () => {
            const res = await getAllRecentlyViewed(account?.id);
            if (res?.EC === 0) {
                setProducts(res.data);
            }
        };
        if (account?.id) {
            fetchProducts();
        }
    }, [account?.id]);

    const settings = {
        dots: false,
        infinite: false,
        centerMode: false, slidesToShow: 5,
        slidesToScroll: 1,
    };
    const navigate = useNavigate();
    return (
        products.length > 0 && (

            <div
                className="flash-sale-section viewed"
                style={{
                    backgroundImage: "url('/GoRec.webp')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center", backgroundSize: "cover"
                }}
            >
                < div className="header-viewed" >
                    <img src='/google-bard-seeklogo.svg' /> SẢN PHẨM ĐÃ XEM GẦN ĐÂY
                </div >
                <Slider {...settings}>
                    {products.map((product) => (
                        <div key={product.product_id} className="flash-sale-item">
                            {product.is_active === 0 && (
                                <div className="overlay-disabled-1">
                                    <div className="overlay-disabled">
                                        <p>Ngừng bán</p></div>
                                </div>
                            )}
                            {product.promotion_type_name && (<div className="discount-badge"><p className='promotion-name'>{product.promotion_type_name}</p></div>)}

                            {product.is_installment_available === 1 ? <div className="installment">Trả góp 0%</div> : ""}

                            <div className="flash-sale-card">
                                <div className="flash-sale-image" onClick={() => navigate(`/products/${product.product_id}`)} >
                                    {
                                        product.image ? (
                                            <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )
                                    }

                                </div>
                                <div className="flash-sale-content">
                                    <h3 className="product-name" onClick={() => navigate(`/products/${product.product_id}`)}>{product.product_name}</h3>
                                    {product.screen_technology && (
                                        <Tag className='option-tag'>{product.screen_technology}</Tag>
                                    )}
                                    {product.screen && (
                                        <Tag className='option-tag'>{product.screen}"</Tag>
                                    )}
                                    {product.refresh_rate && (
                                        <Tag className='option-tag'>{product.refresh_rate}</Tag>
                                    )}
                                    <div className="price-section">
                                        <p className="final-price">
                                            {product?.final_price?.toLocaleString()}₫
                                            {product?.promotion_code === 'custom_price' && ' - Giá Sốc'}
                                        </p>
                                        {product.promotion_code && product.promotion_code !== 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product?.base_price?.toLocaleString()}₫</span>
                                                <span className="discount">
                                                    - {product?.discount_value?.toLocaleString()}
                                                    {product.promotion_code === 'fixed_amount' ? '₫' : '%'}
                                                </span>
                                            </div>
                                        )}
                                        {product.promotion_code && product.promotion_code === 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product?.base_price?.toLocaleString()}₫</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rating-section">
                                        <Rate disabled defaultValue={product.average_rating} className="rating" />
                                        <span className="reviews">{product.total_reviews} đánh giá</span>
                                    </div>
                                    <div className="description">
                                        <p className="description-p">{product.description}</p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))
                    }
                </Slider >
            </div >)
    );
};

const SuggestCurrentlySlider = () => {
    const account = useSelector(state => state.user.account);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            const res = await getSuggestRecenttly(account.id);
            if (res?.EC === 0) {
                setProducts(res.data);
            }
        };

        if (account?.id) {
            fetchProducts();
        }
    }, [account?.id]);

    const settings = {
        dots: false,
        infinite: false,
        centerMode: false, slidesToShow: 5,
        slidesToScroll: 1,
    };
    const navigate = useNavigate();
    return (
        products.length > 0 && (

            <div
                className="flash-sale-section viewed"
                style={{
                    backgroundImage: "url('/GoRec.webp')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center", backgroundSize: "cover"
                }}
            >
                < div className="header-viewed" >
                    <img src='/google-bard-seeklogo.svg' /> GỢI Ý DÀNH CHO BẠN
                </div >
                <Slider {...settings}>
                    {products.map((product) => (
                        <div key={product.product_id} className="flash-sale-item">
                            {product.is_active === 0 && (
                                <div className="overlay-disabled-1">
                                    <div className="overlay-disabled">
                                        <p>Ngừng bán</p></div>
                                </div>
                            )}
                            {product.promotion_type_name && (<div className="discount-badge"><p className='promotion-name'>{product.promotion_type_name}</p></div>)}

                            {product.is_installment_available === 1 ? <div className="installment">Trả góp 0%</div> : ""}

                            <div className="flash-sale-card">
                                <div className="flash-sale-image" onClick={() => navigate(`/products/${product.product_id}`)} >
                                    {
                                        product.image ? (
                                            <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )
                                    }

                                </div>
                                <div className="flash-sale-content">
                                    <h3 className="product-name" onClick={() => navigate(`/products/${product.product_id}`)}>{product.product_name}</h3>
                                    {product.screen_technology && (
                                        <Tag className='option-tag'>{product.screen_technology}</Tag>
                                    )}
                                    {product.screen && (
                                        <Tag className='option-tag'>{product.screen}"</Tag>
                                    )}
                                    {product.refresh_rate && (
                                        <Tag className='option-tag'>{product.refresh_rate}</Tag>
                                    )}
                                    <div className="price-section">
                                        <p className="final-price">
                                            {product?.final_price?.toLocaleString()}₫
                                            {product?.promotion_code === 'custom_price' && ' - Giá Sốc'}
                                        </p>
                                        {product.promotion_code && product.promotion_code !== 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product?.base_price?.toLocaleString()}₫</span>
                                                <span className="discount">
                                                    - {product?.discount_value?.toLocaleString()}
                                                    {product?.promotion_code === 'fixed_amount' ? '₫' : '%'}
                                                </span>
                                            </div>
                                        )}
                                        {product.promotion_code && product?.promotion_code === 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product?.base_price?.toLocaleString()}₫</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rating-section">
                                        <Rate disabled defaultValue={product.average_rating} className="rating" />
                                        <span className="reviews">{product.total_reviews} đánh giá</span>
                                    </div>
                                    <div className="description">
                                        <p className="description-p">{product.description}</p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))
                    }
                </Slider >
            </div >)
    );
};

const SuggestCartSlider = ({ reloadTrigger }) => {
    const account = useSelector(state => state.user.account);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            const cartRes = await getCart(account.id);
            if (cartRes?.EC === 0) {
                const productIds = cartRes.data.map(p => p.product_id);
                const suggestRes = await postSuggestCart(productIds);
                setProducts(suggestRes.data);
            }
        };

        if (account?.id) {
            fetchRecommendations();
        }
    }, [reloadTrigger]);


    const settings = {
        dots: false,
        infinite: false,
        centerMode: false, slidesToShow: 5,
        slidesToScroll: 1,
    };
    const navigate = useNavigate();
    return (
        products.length > 0 && (

            <div
                className="flash-sale-section viewed"
                style={{
                    backgroundImage: "url('/GoRec.webp')",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "center", backgroundSize: "cover"
                }}
            >
                < div className="header-viewed" >
                    <img src='/google-bard-seeklogo.svg' /> SẢN PHẨM CÓ THỂ BẠN SẼ THÍCH
                </div >
                <Slider {...settings}>
                    {products.map((product) => (
                        <div key={product.product_id} className="flash-sale-item">
                            {product.is_active === 0 && (
                                <div className="overlay-disabled-1">
                                    <div className="overlay-disabled">
                                        <p>Ngừng bán</p></div>
                                </div>
                            )}
                            {product.promotion_type_name && (<div className="discount-badge"><p className='promotion-name'>{product.promotion_type_name}</p></div>)}

                            {product.is_installment_available === 1 ? <div className="installment">Trả góp 0%</div> : ""}

                            <div className="flash-sale-card">
                                <div className="flash-sale-image" onClick={() => navigate(`/products/${product.product_id}`)} >
                                    {
                                        product.image ? (
                                            <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                                        ) : (
                                            <div className="no-image">No Image</div>
                                        )
                                    }

                                </div>
                                <div className="flash-sale-content">
                                    <h3 className="product-name" onClick={() => navigate(`/products/${product.product_id}`)}>{product.product_name}</h3>
                                    {product.screen_technology && (
                                        <Tag className='option-tag'>{product.screen_technology}</Tag>
                                    )}
                                    {product.screen && (
                                        <Tag className='option-tag'>{product.screen}"</Tag>
                                    )}
                                    {product.refresh_rate && (
                                        <Tag className='option-tag'>{product.refresh_rate}</Tag>
                                    )}
                                    <div className="price-section">
                                        <p className="final-price">
                                            {product?.final_price?.toLocaleString()}₫
                                            {product?.promotion_code === 'custom_price' && ' - Giá Sốc'}
                                        </p>
                                        {product.promotion_code && product.promotion_code !== 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product?.base_price?.toLocaleString()}₫</span>
                                                <span className="discount">
                                                    - {product?.discount_value?.toLocaleString()}
                                                    {product.promotion_code === 'fixed_amount' ? '₫' : '%'}
                                                </span>
                                            </div>
                                        )}
                                        {product.promotion_code && product.promotion_code === 'custom_price' && (
                                            <div>
                                                <span className="base-price">{product?.base_price?.toLocaleString()}₫</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rating-section">
                                        <Rate disabled defaultValue={product.average_rating} className="rating" />
                                        <span className="reviews">{product.total_reviews} đánh giá</span>
                                    </div>
                                    <div className="description">
                                        <p className="description-p">{product.description}</p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))
                    }
                </Slider >
            </div >)
    );
};

export { FlashSaleSlider, TopProductSection, SuggestionSlider, CurrentlyViewedSlider, SuggestCurrentlySlider, SuggestCartSlider };

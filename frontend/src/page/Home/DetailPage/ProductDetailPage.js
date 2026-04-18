import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBundledProducts, getOneProductExpandFormat } from '../../../services/apiViewService';
import './ProductDetailPage.scss';
import VariantImageSlider from '../../../components/ViewProduct/VariantImageSlider';
import { CiCirclePlus } from "react-icons/ci";
import { toast } from "react-toastify";
import CompareBar from '../../../components/ViewProduct/CompareBar';
import InfoProduct from '../../../components/ViewProduct/InfoProduct';
import { HiOutlineCpuChip } from "react-icons/hi2";
import { FaMobileScreen } from "react-icons/fa6";
import { CiBatteryFull } from "react-icons/ci";
import { MdLocalPolice, MdSupportAgent } from "react-icons/md";
import { TbTruckDelivery } from "react-icons/tb";
import ProductInfo from '../../../components/ViewProduct/ProductInfoDetails';
import { CloseOutlined } from '@ant-design/icons';
import Product360View from '../../../components/ViewProduct/Product360View';
import { SuggestionSlider } from '../../../components/ViewProduct/HomeView';
import ReviewSection from '../../../components/ViewProduct/ReviewSection';

import { useSelector } from 'react-redux';
const ProductDetailPage = () => {
    const account = useSelector(state => state.user.account);
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [loading, setLoading] = useState(true);
    const [compareItems, setCompareItems] = useState([]);
    const [selectedRam, setSelectedRam] = useState(null);
    const [selectedRom, setSelectedRom] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [show3D, setShow3D] = useState(false);
    const [bundles, setBundles] = useState([]);
    const reviewRef = useRef(null);

    const scrollToReview = () => {
        if (reviewRef.current) {
            const y = reviewRef.current.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };
    const options = selectedVariant?.options || [];

    const availableRams = [...new Set(options.map(opt => opt.ram))];
    const availableRoms = [...new Set(options.map(opt => opt.rom))];

    const filteredRoms = selectedRam
        ? [...new Set(options.filter(opt => opt.ram === selectedRam).map(opt => opt.rom))]
        : availableRoms;

    const filteredRams = selectedRom
        ? [...new Set(options.filter(opt => opt.rom === selectedRom).map(opt => opt.ram))]
        : availableRams;
    useEffect(() => {
        const fetchBundles = async () => {
            const res = await getBundledProducts(id);
            if (res.EC === 0) setBundles(res.data);
        };
        fetchBundles();
    }, [id]);
    useEffect(() => {
        const fetchProduct = async () => {

            const res = await getOneProductExpandFormat(id);
            console.log(res)

            if (res?.EC === 0 && res.data?.variants?.length > 0) {
                setProduct(res.data);
                setSelectedVariant(res.data.variants[0]);
                const defaultOption = res.data.variants[0]?.options[0];
                setSelectedOption(defaultOption);
                setSelectedRam(defaultOption?.ram || null);
                setSelectedRom(defaultOption?.rom || null);
            }
            const bundleRes = await getBundledProducts(id);


            setLoading(false);
        };
        fetchProduct();
    }, [id]);
    console.log(product)

    const handleAddToCompare = (product) => {
        if (!product) return;

        if (compareItems.length === 0) {
            setCompareItems([product]);
            return;
        }

        const currentCategory = compareItems[0].category_id;
        if (product.category_id !== currentCategory) {
            setCompareItems([product]);
            return;
        }

        if (compareItems.some((p) => p.id === product.id)) return;

        if (compareItems.length >= 3) {
            toast.warn("Chỉ được so sánh tối đa 3 sản phẩm!");
            return;
        }

        setCompareItems([...compareItems, product]);
    };

    const isCompared = (product) =>
        compareItems.some((item) => item.id === product.id);


    if (!product) return <div>Không tìm thấy sản phẩm</div>;

    const handleSelectVariant = (variant) => {
        setSelectedVariant(variant);
        const firstOpt = variant.options?.[0];
        setSelectedOption(firstOpt || null);
        setSelectedRam(firstOpt?.ram || null);
        setSelectedRom(firstOpt?.rom || null);
    };



    return (
        <div className='page-detail'>
            <div className='product-header'>
                <h3>{product.name}</h3>
                <button
                    className="compare-btn"
                    disabled={isCompared(product)}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCompare(product);
                    }}
                >
                    {isCompared(product)
                        ? <><CiCirclePlus className="plus" /> Đã thêm vào so sánh</>
                        : <><CiCirclePlus className="plus" /> So sánh</>}
                </button>
            </div>
            {show3D && (
                <div className="product-360-overlay">
                    <button className="close-360-btn" onClick={() => setShow3D(false)}><CloseOutlined /></button>
                    <Product360View img_3d={product.img_3d} />
                </div>
            )}
            <div className="product-detail">
                <div className="product-left">
                    <VariantImageSlider
                        images={selectedVariant?.images || []}
                        video={product.link}
                        setShow3D={setShow3D} />

                    <div className='product-left-1'>
                        <div className='product-left-1-0'>
                            <p>Thông số nổi bật</p>
                            <button onClick={() => setShowDetail(true)}>Thông số chi tiết</button>
                        </div>
                        <div className='product-left-1-1'>
                            <div className='product-left-1-1-1 '>
                                <p>Chip</p>
                                <div className='product-left-1-1-1-1' >
                                    <HiOutlineCpuChip /> {product.cpu}
                                </div>
                            </div>
                            <div className='product-left-1-1-1 boder'>
                                <p>Kích thước màn hình</p>
                                <div className='product-left-1-1-1-1'>
                                    <FaMobileScreen /> {product.screen}"
                                </div>
                            </div>
                            <div className='product-left-1-1-1 boder'>
                                <p>Pin</p>
                                <div className='product-left-1-1-1-1'>
                                    <CiBatteryFull /> {product.battery}
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className='product-left-1'>
                        <div className='product-left-1-0'>
                            <p>Chính sách sản phẩm</p>
                        </div>
                        <div className='product-left-1-2'>
                            <div className='product-left-1-2-1'>
                                <MdLocalPolice /> Hàng chính hãng - Bảo hành 12 tháng
                            </div>
                            <div className='product-left-1-2-1'>
                                <MdSupportAgent /> Kỹ thuật viên hỗ trợ trực tuyến
                            </div>
                            <div className='product-left-1-2-1'>
                                <TbTruckDelivery /> Miễn phí giao hàng toàn quốc
                            </div>
                        </div>

                    </div>
                </div>

                <div className="product-right">
                    <InfoProduct
                        product={product}
                        variants={product.variants}
                        selectedVariant={selectedVariant}
                        selectedOption={selectedOption}
                        filteredRams={filteredRams}
                        filteredRoms={filteredRoms}
                        selectedRam={selectedRam}
                        selectedRom={selectedRom}
                        setSelectedOption={setSelectedOption}
                        onSelectVariant={handleSelectVariant}
                        onSelectRam={(ram) => setSelectedRam(ram)}
                        onSelectRom={(rom) => setSelectedRom(rom)}
                        setShowDetail={setShowDetail}
                        scrollToReview={scrollToReview}
                    />
                </div>
            </div>
            <div className="offer">
                {bundles.length > 0 && (
                    <div className="offer-section">
                        <h5><b>🔥 Giảm thêm khi mua kèm</b></h5>
                        <div className="bundle-items-wrap">
                            {bundles.map((item, idx) => {
                                const discountPrice = item.base_price - item.discount_value;
                                return (
                                    <div className="bundle-card-compact" key={idx}>
                                        <img
                                            src={item.image ? `${process.env.REACT_APP_BASE_URL}${item.image}` : "/no-image.png"}
                                            alt={item.product_name}
                                        />
                                        <div className="bundle-info">
                                            <div className="bundle-name" title={item.product_name}>
                                                <b> {item.product_name.length > 35
                                                    ? item.product_name.slice(0, 35) + "..."
                                                    : item.product_name}
                                                </b>
                                            </div>
                                            <div className="bundle-pricing">
                                                <strong>{discountPrice.toLocaleString()} ₫</strong>
                                                <span className="old-price">{item.base_price.toLocaleString()} ₫</span>
                                            </div>
                                            <div className="bundle-save">
                                                Tiết kiệm: {item.discount_value.toLocaleString()} ₫
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>


            <div className='suggestion'>
                <SuggestionSlider
                    id={id}
                />
            </div>
            <div ref={reviewRef} id="review">
                <ReviewSection
                    product_id={id}
                    name={product?.name}
                    primary_image={product?.primary_image}
                />
            </div>
            <ProductInfo
                product={product}
                selectedRam={selectedRam}
                selectedRom={selectedRom}
                showDetail={showDetail}
                onClose={() => setShowDetail(false)}

            />
            <CompareBar
                items={compareItems}
                setCompareItems={setCompareItems}
                onRemove={(id) => setCompareItems(prev => prev.filter(item => item.product_id !== id))}
                onClear={() => setCompareItems([])}
            />
        </div>
    );
};

export default ProductDetailPage;

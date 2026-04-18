import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ComparePage.scss';
import { getOneProductExpandFormat, searchSuggestions } from '../../../services/apiViewService';
import { CloseOutlined } from '@ant-design/icons';
import { GoPlus } from "react-icons/go";
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

import CompareSearch from '../../../components/ViewProduct/CompareSearch';
const ComparePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
    const [showAddBox, setShowAddBox] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {

            const ids = new URLSearchParams(location.search)
                .get('ids')
                ?.split(',')
                .filter(id => id && id.trim() !== '');

            if (!ids || ids.length === 0) {
                setProducts([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            const results = [];

            const normalizeProduct = (data) => {
                const firstOption = data?.variants?.[0]?.options?.[0] || {};
                const first_variant = data?.variants?.[0] || {};
                return {
                    ...data,
                    product_id: data.id,
                    ram: firstOption.ram,
                    rom: firstOption.rom,
                    final_price: firstOption.final_price,
                    base_price: first_variant.base_price,
                };
            };

            for (let id of ids) {
                try {
                    const res = await getOneProductExpandFormat(id);
                    if (res?.data) results.push(normalizeProduct(res.data));
                } catch (error) {
                    console.error('Error fetching product', id, error);
                }
            }
            setShowAddBox(false);
            setKeyword("")
            setSuggestions([])
            setProducts(results);
            setLoading(false);
        };

        fetchProducts();
    }, [location.search]);

    const handleSearch = async (e) => {
        const value = e.target.value;
        setKeyword(value);
        if (value.trim() !== '') {
            const res = await searchSuggestions(value);
            if (res?.EC === 0) {
                setSuggestions(res.data.products || []);
            }
        } else {
            setSuggestions([]);
        }
    };

    const handleAddProduct = (product_id) => {
        const currentIds = new URLSearchParams(location.search).get('ids')?.split(',') || [];

        if (currentIds.includes(product_id.toString())) {
            toast.warn("Sản phẩm này đã được thêm vào so sánh!");
            return;
        }

        getOneProductExpandFormat(product_id).then(res => {
            if (res?.data) {
                const newCategoryId = res.data.category_id;

                if (products.length === 0 || products[0].category_id === newCategoryId) {
                    const newIds = [...currentIds, product_id];
                    navigate(`/compare?ids=${newIds.join(',')}`);
                } else {
                    toast.info("Danh mục khác nhau, đã thay thế sản phẩm để so sánh!");
                    navigate(`/compare?ids=${product_id}`);
                }
            }
        }).catch(err => {
            console.error("Lỗi khi kiểm tra category:", err);
            toast.error("Không thể lấy thông tin sản phẩm.");
        });
    };


    const handleRemoveProduct = (product_id) => {
        const currentIds = new URLSearchParams(location.search).get('ids')?.split(',') || [];
        const newIds = currentIds.filter(id => Number(id) !== Number(product_id));

        navigate(`/compare?ids=${newIds.join(',')}`);
    };

    const getDifference = (field) => {
        const values = products.map(p => p[field]?.toString().toLowerCase().trim() || '');
        return new Set(values).size > 1;
    };

    const renderRow = (label, field) => {
        if (showDifferencesOnly && !getDifference(field)) return null;

        return (
            <div className="compare-row" key={field}>
                <div className="compare-label">{label}</div>
                {products.map(p => {
                    let value = p[field];
                    if (field === 'release_date' && value) {
                        value = dayjs(value).format('DD/MM/YYYY');
                    }
                    return (
                        <div key={p.product_id} className="compare-cell">{value || '—'}</div>
                    );
                })}
                {[...Array(3 - products.length)].map((_, idx) => (
                    <div key={`empty-${field}-${idx}`} className="compare-cell empty"></div>
                ))}
            </div>
        );
    };

    const CollapsibleSection = ({ title, children }) => {
        const [isOpen, setIsOpen] = useState(true);

        return (
            <div className="collapsible-section">
                <div className="section-header" onClick={() => setIsOpen(!isOpen)}>
                    <span>{title}</span>
                    <span className="toggle-icon">{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && <div className="section-content">{children}</div>}
            </div>
        );
    };
    return (
        <div className="compare-page">
            <div className="compare-header">
                <div className='compare-product '>
                    <div className='list-name-compare'>
                        <h3>So sánh sản phẩm</h3>
                        {products.map((p, index) => (
                            p.name && (
                                <div key={p.id || index} className="compare-name-item">
                                    <p><b>{p.name}</b></p>
                                    {(products.length > 1 && index < products.length - 1) && <GoPlus />}
                                </div>
                            )
                        ))}

                    </div>
                    {products.length > 0 && (
                        <div className="compare-options">
                            <input
                                className='check-compare'
                                type="checkbox"
                                checked={showDifferencesOnly}
                                onChange={(e) => setShowDifferencesOnly(e.target.checked)}
                            />
                            <label>
                                Chỉ xem điểm khác biệt
                            </label>
                        </div>
                    )}
                </div>

                {products.map((p) => (
                    <div key={p.product_id} className="compare-product ">
                        <button className="remove-btn-compare " onClick={() => handleRemoveProduct(p.product_id)}>
                            <CloseOutlined />
                        </button>
                        <div className='compare-add'>
                            <img src={`${process.env.REACT_APP_BASE_URL}${p.primary_image}`} alt={p.name} />
                        </div>
                        <h5>{p.name}</h5>
                        <p className="compare-price">
                            {p.final_price ? `${Number(p.final_price).toLocaleString()}₫` : 'Đang cập nhật'}
                        </p>
                        <p className="compare-base-price">
                            {p.base_price ? `${Number(p.base_price).toLocaleString()}₫` : 'Đang cập nhật'}
                        </p>
                        <button className="buy_now" onClick={() => navigate(`/products/${p.product_id}`)} >
                            Mua ngay
                        </button>
                    </div>
                ))}
                {[...Array(3 - products.length)].map((_, idx) => (
                    <div className='compare-product compare-add'>
                        <div className='add-product'>
                            <div
                                key={`add-slot-${idx}`}
                                className="add-slot"
                                onClick={() => setShowAddBox(true)}
                            >
                                +
                            </div>
                            <span>
                                Thêm sản phẩm
                            </span>
                        </div>

                    </div>
                ))}
            </div>

            {
                showAddBox && (
                    <CompareSearch
                        keyword={keyword}
                        setKeyword={setKeyword}
                        suggestions={suggestions}
                        onClose={() => {
                            setShowAddBox(false);
                            setKeyword("");
                            setSuggestions([]);
                        }}
                        onSearch={handleSearch}
                        onSelect={(id) => handleAddProduct(id)}
                    />
                )
            }




            {products.length > 0 && (
                <>

                    <CollapsibleSection title="⚙️ Cấu hình nhanh">
                        <div className="compare-section">
                            {renderRow('Màn hình', 'screen')}
                            {renderRow('RAM', 'ram')}
                            {renderRow('ROM', 'rom')}
                            {renderRow('CPU', 'cpu')}
                            {renderRow('GPU', 'gpu')}
                            {renderRow('Pin', 'battery')}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="📸 Camera & Hiển thị">
                        <div className="compare-section">
                            {renderRow('Camera', 'camera')}
                            {renderRow('Tần số quét', 'refresh_rate')}
                            {renderRow('Công nghệ màn hình', 'screen_technology')}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="🧱 Thiết kế & Kích thước">
                        <div className="compare-section">
                            {renderRow('Chất liệu', 'material')}
                            {renderRow('Kích thước', 'dimensions')}
                            {renderRow('Trọng lượng', 'weight')}
                            {renderRow('Cổng sạc', 'charging_port')}
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="📦 Hệ điều hành & Thời điểm">
                        <div className="compare-section">
                            {renderRow('Hệ điều hành', 'operating_system')}
                            {renderRow('Ngày ra mắt', 'release_date')}
                        </div>
                    </CollapsibleSection>
                </>
            )}

        </div >
    );
};

export default ComparePage;

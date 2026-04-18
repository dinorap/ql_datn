import React, { useState, useEffect } from 'react';
import './CompareBar.scss';
import { CloseOutlined, UpOutlined } from '@ant-design/icons';
import { IoIosArrowDropdown } from "react-icons/io";

import { searchSuggestions, getOneProductExpandFormat } from '../../services/apiViewService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import CompareSearch from './CompareSearch';

const CompareBar = ({ items = [], onRemove, onClear, setCompareItems }) => {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(true);
    const [showAddBox, setShowAddBox] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    useEffect(() => {
        if (items.length > 0) {
            setExpanded(true);
        }
    }, [items.length]);

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

    const handleAddProduct = async (product_id) => {
        if (items.find(item => item.product_id === product_id || item.id === product_id)) {
            toast.warn("Sản phẩm này đã có trong danh sách so sánh!");
            return;
        }

        try {
            const res = await getOneProductExpandFormat(product_id);
            if (res?.data) {
                const newProduct = res.data;
                const newCategoryId = newProduct.category_id;

                if (items.length === 0 || items[0].category_id === newCategoryId) {
                    setCompareItems([...items, {
                        product_id: newProduct.id,
                        product_name: newProduct.name,
                        image: newProduct.primary_image,
                        final_price: newProduct.variants?.[0]?.options?.[0]?.final_price,
                        category_id: newProduct.category_id,
                    }]);
                } else {
                    toast.info("Danh mục khác nhau, đã thay thế sản phẩm để so sánh!");
                    setCompareItems([{
                        product_id: newProduct.id,
                        product_name: newProduct.name,
                        image: newProduct.primary_image,
                        final_price: newProduct.variants?.[0]?.options?.[0]?.final_price,
                        category_id: newProduct.category_id,
                    }]);
                }
            }
        } catch (err) {
            toast.error("Lỗi khi thêm sản phẩm");
        }

        setShowAddBox(false);
        setKeyword('');
        setSuggestions([]);
    };


    const handleCompare = () => {
        const ids = items.map(i => i.product_id || i.id).join(',');
        navigate(`/compare?ids=${ids}`);
    };

    if (items.length === 0) return null;

    return (
        <>
            <div className={`compare-bar ${expanded ? 'expanded' : 'collapsed'}`}>
                <div className="compare-element">
                    <div className="compare-items">
                        {items.map((item) => (
                            <div key={item.product_id} className="compare-item">
                                <img
                                    src={`${process.env.REACT_APP_BASE_URL}${item?.image || item?.primary_image}`}
                                    alt={item.product_name}
                                />
                                <div className="info">
                                    <p className="name">{item.product_name || item.name}</p>
                                    <p className="price">{item?.final_price?.toLocaleString?.() || item?.variants[0]?.options[0]?.final_price?.toLocaleString?.()}₫</p>
                                </div>
                                <button className="remove-btn-compare" onClick={() => onRemove(item.product_id)}>
                                    <CloseOutlined />
                                </button>
                            </div>
                        ))}

                        {[...Array(3 - items.length)].map((_, idx) => (
                            <div key={idx} className="compare-slot" onClick={() => setShowAddBox(true)}>
                                <div className="add-slot-bar">+</div>
                            </div>
                        ))}
                    </div>

                    <div className="compare-actions">
                        <button className="clear-btn" onClick={onClear}>
                            Xóa tất cả
                        </button>
                        <button className="compare-btn" disabled={items.length < 2} onClick={handleCompare}>
                            So sánh ngay
                        </button>
                        {expanded && (
                            <div className="compare-toggle inside" onClick={() => setExpanded(false)}>
                                <IoIosArrowDropdown />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showAddBox && (
                <CompareSearch
                    keyword={keyword}
                    setKeyword={setKeyword}
                    suggestions={suggestions}
                    onClose={() => {
                        setShowAddBox(false);
                        setKeyword('');
                        setSuggestions([]);
                    }}
                    onSearch={handleSearch}
                    onSelect={handleAddProduct}
                />
            )}

            {!expanded && (
                <div className="compare-toggle outside" onClick={() => setExpanded(true)}>
                    So sánh ({items.length}) <UpOutlined />
                </div>
            )}
        </>
    );
};

export default CompareBar;

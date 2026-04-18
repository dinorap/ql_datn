import React from 'react';
import './CompareSearch.scss';
const CompareSearch = ({
    keyword,
    setKeyword,
    suggestions = [],
    onClose,
    onSearch,
    onSelect
}) => {
    return (
        <div className="compare-modal-overlay">
            <div className="compare-modal">
                <button className="close-btn" onClick={onClose}>×</button>
                <h4>Nhập tên để tìm sản phẩm</h4>
                <input
                    type="text"
                    placeholder="Nhập tên sản phẩm"
                    value={keyword}
                    onChange={onSearch}
                    className="compare-add-input"
                />

                <ul className="compare-suggestions">
                    {suggestions.map(product => (
                        <li
                            key={`sugg-${product.product_id}`}
                            onClick={() => onSelect(product.product_id)}
                            className="compare-suggestion-item"
                        >
                            <img src={`${process.env.REACT_APP_BASE_URL}${product.image}`} alt={product.product_name} />
                            <div>
                                <p>{product.product_name}</p>
                                <p className="compare-price-sug">
                                    {product.final_price ? `${Number(product.final_price).toLocaleString()}₫` : 'Đang cập nhật'}
                                </p>
                                <p className="compare-base-price-sug">
                                    {product.base_price ? `${Number(product.base_price).toLocaleString()}₫` : 'Đang cập nhật'}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default CompareSearch;

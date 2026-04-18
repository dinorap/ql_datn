import React, { useEffect } from 'react';
import './ProductInfoDetails.scss';

function ProductInfoDetails({ product, showDetail, onClose, selectedRam, selectedRom }) {
    useEffect(() => {
        document.body.style.overflow = showDetail ? 'hidden' : 'auto';
        return () => (document.body.style.overflow = 'auto');
    }, [showDetail]);

    if (!showDetail) return null;

    const sections = [
        {
            title: 'Thông tin chung',
            content: (
                <>
                    <div className="row"><div className="label">Tên sản phẩm</div><div className="value">{product.name}</div></div>
                    <div className="row"><div className="label">Mã SP</div><div className="value">{product.product_code}</div></div>
                    <div className="row"><div className="label">Hệ điều hành</div><div className="value">{product.operating_system}</div></div>
                    <div className="row"><div className="label">Ngày ra mắt</div><div className="value">{new Date(product.release_date).toLocaleDateString()}</div></div>
                </>
            )
        },
        {
            title: 'Thiết kế',
            content: (
                <>
                    <div className="row"><div className="label">Chất liệu</div><div className="value">{product.material}</div></div>
                    <div className="row"><div className="label">Kích thước</div><div className="value">{product.dimensions}</div></div>
                    <div className="row"><div className="label">Trọng lượng</div><div className="value">{product.weight}</div></div>
                    <div className="row"><div className="label">Kháng nước</div><div className="value">{product.ip_rating || 'Không rõ'}</div></div>
                </>
            )
        },
        {
            title: 'Màn hình',
            content: (
                <>
                    <div className="row"><div className="label">Công nghệ màn hình</div><div className="value">{product.screen_technology}</div></div>
                    <div className="row"><div className="label">Kích thước</div><div className="value">{product.screen}"</div></div>
                    <div className="row"><div className="label">Tần số quét</div><div className="value">{product.refresh_rate}</div></div>
                </>
            )
        },
        {
            title: 'Hiệu năng',
            content: (
                <>
                    <div className="row"><div className="label">Ram</div><div className="value">{selectedRam}</div></div>
                    <div className="row"><div className="label">Rom</div><div className="value">{selectedRom}</div></div>
                    <div className="row"><div className="label">CPU</div><div className="value">{product.cpu}</div></div>
                    <div className="row"><div className="label">GPU</div><div className="value">{product.gpu}</div></div>
                    <div className="row"><div className="label">Camera</div><div className="value">{product.camera}</div></div>
                </>
            )
        },
        {
            title: 'Pin & Sạc',
            content: (
                <>
                    <div className="row"><div className="label">Dung lượng pin</div><div className="value">{product.battery}</div></div>
                    <div className="row"><div className="label">Cổng sạc</div><div className="value">{product.charging_port}</div></div>
                </>
            )
        },

        {
            title: 'Khác',
            content: (
                <>
                    <div className="row"><div className="label">Trả góp</div><div className="value">{product.is_installment_available ? 'Có' : 'Không'}</div></div>
                    <div className="row"><div className="label">Quà tặng</div><div className="value">{product.description}</div></div>
                </>
            )
        }
    ];

    return (
        <>
            <div className="overlay" onClick={onClose}></div>
            <div className="detail-panel">
                <div className="detail-header">
                    <p>Thông số kỹ thuật</p>
                    <button onClick={onClose}>✖</button>
                </div>
                <div className='detail-image'>
                    <img src={`${process.env.REACT_APP_BASE_URL}${product.primary_image}`} alt='detail'></img>
                </div>

                <div className="detail-body">
                    {sections.map((section, idx) => (
                        <details key={idx} className="section" open>
                            <summary className="section-title">{section.title}</summary>
                            {section.content}
                        </details>
                    ))}
                </div>
            </div>
        </>
    );
}

export default ProductInfoDetails;

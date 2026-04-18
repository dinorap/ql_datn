import { Modal, Tag, Image, Descriptions } from 'antd';

const ModalViewVariant = ({ show, setShow, dataView }) => {
    const handleClose = () => setShow(false);
    const promotion = dataView?.promotion;



    const renderDiscountValue = () => {
        if (!promotion) return '-';
        const value = promotion.discount_value;
        const type = promotion.promotion_code;

        switch (type) {
            case 'percentage':
                return `Giảm: ${value}%`;
            case 'fixed_amount':
                return `Giảm: ${parseInt(value).toLocaleString()} đ`;
            case 'custom_price':
                return `Giá KM: ${parseInt(value).toLocaleString()} đ`;
            default:
                return '-';
        }
    };

    const getImageUrl = (imagePath) => {
        const baseUrl = process.env.REACT_APP_BASE_URL || 'http://localhost:8080';
        const url = `${baseUrl}${imagePath}`;

        return url;
    };

    return (
        <Modal
            open={show}
            onCancel={handleClose}
            footer={null}
            title="Thông tin biến thể"
            width={650}
        >
            <Descriptions
                bordered
                column={1}
                size="middle"
                labelStyle={{ width: 200, fontWeight: 500 }}
            >
                <Descriptions.Item label="Mã biến thể">
                    {dataView?.variant_code}
                </Descriptions.Item>
                <Descriptions.Item label="Màu sắc">
                    {dataView?.color}
                </Descriptions.Item>
                <Descriptions.Item label="Giá gốc">
                    {parseInt(dataView?.base_price || 0).toLocaleString()} đ
                </Descriptions.Item>
                <Descriptions.Item label="Khuyến mại">
                    {
                        promotion
                            ? <Tag color="green">{promotion.promotion_code}</Tag>
                            : 'Không có'
                    }
                </Descriptions.Item>
                <Descriptions.Item label="Giá trị khuyến mại">
                    {renderDiscountValue()}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày bắt đầu KM">
                    {promotion?.start_date || 'Không có'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày kết thúc KM">
                    {promotion?.end_date || 'Không có'}
                </Descriptions.Item>

                <Descriptions.Item label="Ảnh chi tiết">
                    {
                        dataView?.images?.length > 0 ? (
                            <div className='image-list-wrapper'>
                                {
                                    dataView.images.map((imagePath, idx) => (
                                        <Image
                                            key={`detail-${idx}`}
                                            src={getImageUrl(imagePath)}
                                            alt={`detail-img-${idx}`}
                                            className='product-image'
                                        />
                                    ))
                                }
                            </div>
                        ) : 'Không có ảnh'
                    }
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ModalViewVariant;

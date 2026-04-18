import {
    Modal, Form, Input, InputNumber, Select, DatePicker, Upload, Button, Image
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { updateVariant } from '../../../services/apiProductService';
import { getAllPromotionType } from '../../../services/apiPromotionService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const ModalUpdateVariant = ({
    show, setShow, fetchListWithPaginate,
    currentPage, dataUpdate, searchType, searchTerm
}) => {
    const [form] = Form.useForm();
    const [promotionTypes, setPromotionTypes] = useState([]);
    const [promotionCode, setPromotionCode] = useState(null);

    const [detailImages, setDetailImages] = useState([]); const [uploadFileList, setUploadFileList] = useState([]);
    useEffect(() => {
        fetchPromotionTypes();
    }, []);

    useEffect(() => {
        if (show && dataUpdate) {
            const { product_id, color, base_price, variant_code, promotion, images } = dataUpdate;

            form.setFieldsValue({
                product_id,
                variant_code,
                color,
                base_price,
                promotion_type_code: promotion?.promotion_code || null,
                discount_value: promotion?.discount_value || null,
                start_date: promotion?.start_date ? dayjs(promotion.start_date) : null,
                end_date: promotion?.end_date ? dayjs(promotion.end_date) : null,
            });

            setPromotionCode(promotion?.promotion_code || null);

            const detailImgs = images?.map(imgPath => `${process.env.REACT_APP_BASE_URL}${imgPath}`) || [];
            setDetailImages(detailImgs);

            const files = detailImgs.map((url, idx) => ({
                uid: `${idx}`,
                name: `image-${idx}.jpg`,
                status: 'done',
                url
            }));
            setUploadFileList(files);
        }
    }, [show, dataUpdate]);


    const fetchPromotionTypes = async () => {
        const res = await getAllPromotionType();
        if (res?.EC === 0) setPromotionTypes(res.data);
    };

    const handleFinish = async (values) => {
        const formData = new FormData();

        for (const [key, value] of Object.entries(values)) {
            if (value !== null && value !== undefined) {
                if (dayjs.isDayjs(value)) {
                    formData.append(key, value.format('YYYY-MM-DD HH:mm:ss'));
                } else {
                    formData.append(key, value);
                }
            }
        }


        detailImages.forEach(url => {
            try {
                const urlObj = new URL(url);
                const path = decodeURIComponent(urlObj.pathname);
                formData.append('remaining_images', path);
            } catch (err) {
                console.error("Error parsing URL:", url, err);
            }
        });



        uploadFileList.forEach(file => {
            if (file.originFileObj) {

                formData.append("detail_images", file.originFileObj);
            }
        });

        const res = await updateVariant(dataUpdate.id, formData);
        if (res?.EC === 0) {
            toast.success("Cập nhật biến thể thành công");
            handleCancel();
            fetchListWithPaginate(currentPage, searchType, searchTerm);
        } else {
            toast.error(res?.EM || 'Có lỗi xảy ra');
        }
    };


    const handleCancel = () => {
        setShow(false);
        form.resetFields();
        setPromotionCode(null);
        setDetailImages([]);
        setUploadFileList([]);
    };

    const handlePromotionChange = (val) => {
        setPromotionCode(val);
        form.setFieldValue("promotion_type_code", val);
    };

    const handleDetailChange = ({ fileList }) => {
        setUploadFileList(fileList);
        const newImages = fileList.map(f => {
            return new Promise(resolve => {
                if (f.originFileObj) {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(f.originFileObj);
                } else {
                    resolve(f.url);
                }
            });
        });
        Promise.all(newImages).then(setDetailImages);
    };


    const handleRemoveDetailImage = (index) => {
        setDetailImages(prev => prev.filter((_, i) => i !== index));
        setUploadFileList(prev => prev.filter((_, i) => i !== index));
    };

    const suffix =
        promotionCode === 'percentage'
            ? '%'
            : promotionCode === 'fixed_amount' || promotionCode === 'custom_price'
                ? 'VNĐ'
                : '';

    const suffixPlaceholder =
        promotionCode === 'percentage'
            ? 'Nhập phần trăm khuyến mại'
            : promotionCode === 'fixed_amount'
                ? 'Nhập số tiền giảm'
                : promotionCode === 'custom_price'
                    ? 'Nhập giá khuyến mại'
                    : '';

    return (
        <Modal
            className='create-top'
            open={show}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            title="Cập nhật biến thể"
            okText="Cập nhật"
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name="product_id" hidden><Input hidden /></Form.Item>
                <Form.Item name="variant_code" label="Mã biến thể"><Input /></Form.Item>
                <Form.Item name="color" label="Màu sắc" rules={[{ required: true }]}><Input /></Form.Item>
                <Form.Item name="base_price" label="Giá gốc" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="promotion_type_code" label="Loại khuyến mãi">
                    <Select
                        placeholder="Chọn loại khuyến mãi"
                        allowClear
                        onChange={handlePromotionChange}
                        options={promotionTypes.map(pt => ({ label: pt.name, value: pt.code }))}
                    />
                </Form.Item>

                {promotionCode && <>
                    <Form.Item name="discount_value" label="Giá trị khuyến mãi" rules={[{ required: true }]}>
                        <Input addonAfter={suffix} placeholder={suffixPlaceholder} />
                    </Form.Item>
                    <Form.Item name="start_date" label="Ngày bắt đầu KM" rules={[{ required: true }]}>
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="end_date" label="Ngày kết thúc KM" rules={[{ required: true }]}>
                        <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" style={{ width: '100%' }} />
                    </Form.Item>
                </>}

                <Form.Item label="Ảnh chi tiết (nhiều ảnh)">
                    <Upload
                        multiple
                        beforeUpload={() => false}
                        fileList={uploadFileList}
                        showUploadList={false}
                        onChange={handleDetailChange}
                    >
                        <Button icon={<PlusOutlined />}>Thêm ảnh chi tiết</Button>
                    </Upload>
                    <div className="image-list-wrapper" style={{ marginTop: 5 }}>
                        {detailImages.map((img, idx) => (
                            <div key={idx} className="image-container">
                                <Image src={img} alt={`detail-${idx}`} className="product-image" />
                                <Button type="text" danger className="remove-btn" onClick={() => handleRemoveDetailImage(idx)}>X</Button>
                            </div>
                        ))}
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalUpdateVariant;

import { Modal, Form, Input, InputNumber, Select, DatePicker, Upload, Button, Image } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { createVariant } from '../../../services/apiProductService';
import { getAllPromotionType } from '../../../services/apiPromotionService';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const ModalCreateVariant = ({ show, setShow, fetchListWithPaginate, currentPage, product_id, searchType, searchTerm, }) => {
    const [form] = Form.useForm();
    const [promotionTypes, setPromotionTypes] = useState([]);
    const [promotionCode, setPromotionCode] = useState(null);
    const [uploadFileList, setUploadFileList] = useState([]);

    useEffect(() => {
        if (show) {
            form.resetFields();
            setPromotionCode(null);
            setUploadFileList([]);
        }
    }, [show]);

    useEffect(() => {
        fetchPromotionTypes();
    }, []);

    const fetchPromotionTypes = async () => {
        const res = await getAllPromotionType();
        if (res?.EC === 0) setPromotionTypes(res.data);
    };

    const handleFinish = async (values) => {
        const formData = new FormData();

        formData.append('product_id', product_id);
        formData.append('variant_code', values.variant_code);
        formData.append('color', values.color);
        formData.append('base_price', values.base_price);

        if (values.promotion_type_code) {
            formData.append('promotion_type_code', values.promotion_type_code);
            formData.append('discount_value', values.discount_value);
            formData.append('start_date', values.start_date?.format('YYYY-MM-DD HH:mm:ss'));
            formData.append('end_date', values.end_date?.format('YYYY-MM-DD HH:mm:ss'));
        }

        uploadFileList.forEach((file) => {
            formData.append('detail_images', file.originFileObj);
        });

        try {
            const response = await createVariant(formData);


            if (response?.EC === 0) {
                toast.success(response.EM);
                handleCancel();
                fetchListWithPaginate(currentPage, searchType, searchTerm);
            } else {
                toast.error(response.EM || 'Có lỗi xảy ra khi tạo biến thể');
            }
        } catch (error) {
            console.error('Error creating variant:', error);
            toast.error(error.response?.EM || 'Có lỗi xảy ra khi tạo biến thể');
        }
    };

    const handleDetailChange = ({ fileList }) => {
        setUploadFileList(fileList);
    };

    const handleCancel = () => {
        setShow(false);
        form.resetFields();
        setPromotionCode(null);
        setUploadFileList([]);
    };

    const handleRemoveDetailImage = (index) => {
        const newFileList = [...uploadFileList];
        newFileList.splice(index, 1);
        setUploadFileList(newFileList);
    };

    const suffix =
        promotionCode === 'percentage'
            ? '%'
            : promotionCode === 'fixed_amount' || promotionCode === 'custom_price'
                ? 'VNĐ'
                : '';

    const suffax =
        promotionCode === 'percentage'
            ? 'Nhập phần trăm khuyến mại'
            : promotionCode === 'fixed_amount'
                ? 'Nhập số tiền giảm'
                : promotionCode === 'custom_price'
                    ? "Nhập giá khuyến mại"
                    : '';

    return (
        <Modal
            open={show}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            title="Thêm biến thể"
            okText="Tạo"
            cancelText="Hủy"
            className='create-top'
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name="variant_code" label="Mã biến thể" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="color" label="Màu sắc" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="base_price" label="Giá gốc" rules={[{ required: true }]}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="promotion_type_code" label="Loại khuyến mãi">
                    <Select
                        placeholder="Chọn loại khuyến mãi"
                        allowClear
                        onChange={(val) => setPromotionCode(val)}
                        options={promotionTypes.map(pt => ({ label: pt.name, value: pt.code }))}
                    />
                </Form.Item>

                {promotionCode && <>
                    <Form.Item name="discount_value" label="Giá trị khuyến mãi" rules={[{ required: true }]}>
                        <Input addonAfter={suffix} placeholder={suffax} />
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
                        showUploadList={false}
                        fileList={uploadFileList}
                        onChange={handleDetailChange}
                    >
                        <Button icon={<PlusOutlined />}>Thêm ảnh chi tiết</Button>
                    </Upload>

                    <div className="image-list-wrapper" style={{ marginTop: 5 }}>
                        {uploadFileList.map((file, idx) => (
                            <div key={idx} className="image-container">
                                <Image
                                    src={URL.createObjectURL(file.originFileObj)}
                                    alt={`detail-${idx}`}
                                    className="product-image"
                                />
                                <Button
                                    type="text"
                                    danger
                                    className="remove-btn"
                                    onClick={() => handleRemoveDetailImage(idx)}
                                >
                                    X
                                </Button>
                            </div>
                        ))}
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalCreateVariant;

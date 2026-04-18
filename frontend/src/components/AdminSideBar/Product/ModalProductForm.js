import { Modal, Form, Input, InputNumber, Select, DatePicker, Upload, Button, Image } from 'antd';
import { UploadOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { createProduct, updateProduct } from '../../../services/apiProductService';
import { getTypeCompanies } from '../../../services/apiAdvertise';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
const ModalProductForm = ({
    show,
    setShow,
    fetchListWithPaginate,
    currentPage,
    category_id,
    mode = 'create',
    dataUpdate = {}
}) => {
    const [form] = Form.useForm();
    const [companies, setCompanies] = useState([]);
    const [primaryImage, setPrimaryImage] = useState(null);
    const [img3D, setImg3D] = useState(null);
    const [fileList3D, setFileList3D] = useState([]);
    const [removePrimaryImage, setRemovePrimaryImage] = useState(false);
    const [bundles, setBundles] = useState([{ bundled_product_id: '', discount_value: '' }]);
    useEffect(() => {
        fetchCompanies();
    }, [category_id]);

    useEffect(() => {
        if (show) {
            if (mode === 'edit' && dataUpdate) {
                const updatedValues = {
                    ...dataUpdate,
                    is_installment_available: !!dataUpdate.is_installment_available,
                    release_date: dataUpdate.release_date ? dayjs(dataUpdate.release_date) : null
                };
                setPrimaryImage(dataUpdate.primary_image ? `${process.env.REACT_APP_BASE_URL}${dataUpdate.primary_image}` : null);

                form.setFieldsValue(updatedValues);

                setBundles(
                    dataUpdate.bundled_products?.length
                        ? dataUpdate.bundled_products.map(b => ({
                            bundled_product_id: String(b.bundled_product_id),
                            discount_value: Number(b.discount_value),
                        }))
                        : [{ bundled_product_id: '', discount_value: '' }]
                );
            }
        }
    }, [show, mode, dataUpdate]);


    const fetchCompanies = async () => {
        const res = await getTypeCompanies(category_id);
        if (res.EC === 0) setCompanies(res.data);
    };

    const handlePrimaryChange = ({ file }) => {
        const reader = new FileReader();
        reader.onload = () => setPrimaryImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handle3DChange = ({ file, fileList }) => {
        setImg3D(file);
        setFileList3D(fileList);
    };

    const handleFinish = async (values) => {
        const payload = {
            ...values,
            category_id,
            release_date: values.release_date ? values.release_date.format('YYYY-MM-DD') : null,
            primary_image: primaryImage,
            img_3d: img3D || null,
            remove_img_3d: !img3D && !fileList3D.length && !dataUpdate.img_3d,
            remove_primary_image: removePrimaryImage || !primaryImage,
            bundled_products: bundles
        };



        let res;
        if (mode === 'edit') {
            res = await updateProduct(dataUpdate.id, payload);
        } else {
            res = await createProduct(payload);
        }

        if (res?.EC === 0) {
            toast.success(`${mode === 'edit' ? 'Cập nhật' : 'Tạo'} sản phẩm thành công!`);
            setShow(false);
            form.resetFields();
            setPrimaryImage(null);
            setImg3D(null);
            setFileList3D([]);
            setBundles([{ bundled_product_id: '', discount_value: '' }]); if (mode === "edit") {
                fetchListWithPaginate(currentPage);
            }
            else {
                fetchListWithPaginate(1);
            }
        } else {
            toast.error(res?.EM || 'Có lỗi xảy ra');
        }
    };
    const handleAddBundle = () => {
        setBundles([...bundles, { bundled_product_id: '', discount_value: '' }]);
    };

    const handleBundleChange = (index, field, value) => {
        const updatedBundles = [...bundles];
        updatedBundles[index][field] = value;
        setBundles(updatedBundles);
    };

    const handleRemoveBundle = (index) => {
        const updatedBundles = [...bundles];
        updatedBundles.splice(index, 1);
        setBundles(updatedBundles);
    };

    return (
        <Modal
            className='create-top'
            open={show}
            onCancel={() => {
                setShow(false);
                form.resetFields();
                setPrimaryImage(null);
                setImg3D(null);
                setFileList3D([]);
                setBundles([{ bundled_product_id: '', discount_value: '' }]);
            }}
            onOk={() => form.submit()}
            title={mode === 'edit' ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
            okText={mode === 'edit' ? 'Cập nhật' : 'Tạo'}
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name="product_code" label="Mã sản phẩm" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="company_id" label="Hãng" rules={[{ required: true }]}>
                    <Select
                        showSearch
                        placeholder="Chọn hãng"
                        optionFilterProp="label"
                        filterOption={(input, option) =>
                            option?.label?.toLowerCase().includes(input.toLowerCase())
                        }
                        options={companies.map(c => ({ label: c.name, value: c.id }))}
                    />
                </Form.Item>

                <Form.Item name="is_installment_available" label="Hỗ trợ trả góp" rules={[{ required: true }]}>
                    <Select placeholder="Chọn trạng thái">
                        <Select.Option value={true}>Có</Select.Option>
                        <Select.Option value={false}>Không</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item label="Ảnh tổng quan (chính)">
                    <Upload
                        maxCount={1}
                        beforeUpload={() => false}
                        showUploadList={false}
                        onChange={handlePrimaryChange}
                    >
                        <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                    </Upload>
                    <div className="image-list-wrapper">
                        {primaryImage && (
                            <div className="image-container">
                                <Image src={primaryImage} alt="primary" className="product-image" style={{ marginTop: 5 }} />
                                <Button
                                    type="text"
                                    danger
                                    onClick={() => {
                                        setPrimaryImage(null);
                                        setRemovePrimaryImage(true);
                                    }}
                                >
                                    X
                                </Button>
                            </div>
                        )}

                    </div>
                </Form.Item>

                <Form.Item label="File 3D (.glb)">
                    <Upload
                        accept=".glb"
                        maxCount={1}
                        beforeUpload={() => false}
                        fileList={fileList3D}
                        onChange={handle3DChange}
                    >
                        <Button icon={<UploadOutlined />}>Chọn file 3D</Button>
                    </Upload>

                    {(!fileList3D.length && dataUpdate.img_3d) && (
                        <div style={{ marginTop: 10 }}>
                            {dataUpdate.img_3d.split('/').pop()}
                            <Button
                                type="text"
                                danger
                                onClick={() => {
                                    setImg3D(null);
                                    setFileList3D([]);
                                    dataUpdate.img_3d = null;
                                }}
                            >
                                X
                            </Button>
                        </div>
                    )}
                </Form.Item>


                <Form.Item name="screen" label="Màn hình">
                    <Input />
                </Form.Item>
                <Form.Item name="camera" label="Camera">
                    <Input />
                </Form.Item>
                <Form.Item name="gpu" label="GPU">
                    <Input />
                </Form.Item>
                <Form.Item name="cpu" label="CPU">
                    <Input />
                </Form.Item>
                <Form.Item name="battery" label="Pin">
                    <Input />
                </Form.Item>
                <Form.Item name="operating_system" label="Hệ điều hành">
                    <Input />
                </Form.Item>
                <Form.Item name="weight" label="Khối lượng">
                    <Input addonAfter="gram" />
                </Form.Item>
                <Form.Item name="dimensions" label="Kích thước">
                    <Input placeholder="Dài x Rộng x Cao (mm)" />
                </Form.Item>
                <Form.Item name="material" label="Chất liệu">
                    <Input />
                </Form.Item>
                <Form.Item name="refresh_rate" label="Tần số quét">
                    <Input addonAfter="Hz" />
                </Form.Item>
                <Form.Item name="screen_technology" label="Công nghệ màn hình">
                    <Input />
                </Form.Item>
                <Form.Item name="charging_port" label="Cổng sạc">
                    <Input />
                </Form.Item>
                <Form.Item name="release_date" label="Ngày ra mắt">
                    <DatePicker format="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item name="link" label="Link">
                    <Input />
                </Form.Item>
                <Form.Item name="description" label="Quà tặng">
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="gift" label="Mô tả">
                    <Input />
                </Form.Item>

                <Form.Item label="Sản phẩm đi kèm">
                    {bundles.map((bundle, index) => (
                        <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                            <Input placeholder="ID sản phẩm đi kèm" style={{ width: '50%' }} value={bundle.bundled_product_id} onChange={(e) => handleBundleChange(index, 'bundled_product_id', e.target.value)} />
                            <InputNumber
                                placeholder="Giảm giá"
                                style={{ width: '40%' }}
                                value={bundle.discount_value}
                                onChange={(value) => handleBundleChange(index, 'discount_value', value)}
                                addonAfter="VND"
                            />

                            <Button danger onClick={() => handleRemoveBundle(index)}>X</Button>
                        </div>
                    ))}
                    <Button icon={<PlusOutlined />} type="dashed" onClick={handleAddBundle}>Thêm sản phẩm đi kèm</Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalProductForm;
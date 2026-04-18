import { Modal, Form, Input, InputNumber } from 'antd';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import { createOption, updateOption } from '../../../services/apiProductService';

const ModalOptionForm = ({
    variant_id,
    show,
    setShow,
    mode = 'create',
    dataUpdate = {},
    fetchListWithPaginate,
    currentPage,
    searchType,
    searchTerm,
}) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (show) {
            if (mode === 'edit' && dataUpdate) {
                form.setFieldsValue(dataUpdate);
            } else {
                form.resetFields();
            }
        }
    }, [show, mode, dataUpdate]);

    const handleFinish = async (values) => {
        const payload = {
            ...values,
            variant_id,
        };

        let res;
        if (mode === 'edit') {
            res = await updateOption(dataUpdate.id, payload);
        } else {
            res = await createOption(payload);
        }

        if (res?.EC === 0) {
            toast.success(`${mode === 'edit' ? 'Cập nhật' : 'Tạo'} cấu hình thành công!`);
            setShow(false);
            form.resetFields();
            fetchListWithPaginate(currentPage, searchType, searchTerm);
        } else {
            toast.error(res?.EM || 'Có lỗi xảy ra');
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setShow(false);
    };

    return (
        <Modal
            open={show}
            onCancel={handleCancel}
            onOk={() => form.submit()}
            title={mode === 'edit' ? 'Cập nhật cấu hình biến thể' : 'Thêm cấu hình biến thể'}
            okText={mode === 'edit' ? 'Cập nhật' : 'Tạo'}
            cancelText="Hủy"
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item name="ram" label="RAM">
                    <Input placeholder="Ví dụ: 4GB" />
                </Form.Item>

                <Form.Item name="rom" label="ROM">
                    <Input placeholder="Ví dụ: 64GB" />
                </Form.Item>

                <Form.Item name="extra_price" label="Giá cộng thêm">
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="stock_quantity" label="Số lượng trong kho">
                    <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalOptionForm;

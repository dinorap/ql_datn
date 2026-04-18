import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { postCreatePromotionType } from '../../../services/apiPromotionService';

const ModalCreatePromotionType = (props) => {
    const { show, setShow } = props;

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [formula, setFormula] = useState('');

    const handleClose = () => {
        setName('');
        setCode('');
        setDescription('');
        setFormula('');
        setShow(false);
    };

    const handleSubmit = async () => {
        if (!name || !code || !formula) {
            toast.error("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        let res = await postCreatePromotionType(name, code, description, formula);

        if (res && res.EC === 0) {
            toast.success("Thêm loại khuyến mãi thành công!");
            handleClose();
            props.setCurrentPage(1);
            await props.fetchListWithPaginate(1);
        } else {
            toast.error(res?.EM || "Thêm thất bại!");
        }
    };

    const handleCodeChange = (value) => {
        setCode(value);

        if (value === 'percentage') {
            setFormula('{{base}} - ({{base}} * {{value}} / 100)');
        } else if (value === 'fixed_amount') {
            setFormula('{{base}} - {{value}}');
        } else if (value === 'custom_price') {
            setFormula('{{value}}');
        } else {
            setFormula('');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" backdrop="static" className='modal-add-user'>
            <Modal.Header closeButton>
                <Modal.Title>Thêm loại khuyến mãi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Tên loại khuyến mãi</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Ưu đãi sinh viên"
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Loại khuyến mãi</Form.Label>
                        <Form.Select value={code} onChange={(e) => handleCodeChange(e.target.value)}>
                            <option value="">-- Chọn loại --</option>
                            <option value="percentage">Giảm theo phần trăm</option>
                            <option value="fixed_amount">Giảm số tiền cố định</option>
                            <option value="custom_price">Giá khuyến mại cố định</option>
                        </Form.Select>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Mô tả</Form.Label>
                        <Form.Control
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="VD: Giảm 10% cho sinh viên có thẻ"
                        />
                    </Form.Group>


                    <Form.Control type="hidden" value={formula} readOnly />
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Đóng</Button>
                <Button variant="primary" onClick={handleSubmit}>Lưu</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalCreatePromotionType;

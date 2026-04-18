import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';

import { putUpdatePromotionType } from '../../../services/apiPromotionService';

const ModalUpdatePromotionType = (props) => {
    const { show, setShow, dataUpdate, resetUpdateData, fetchListWithPaginate, currentPage, searchType, searchTerm } = props;

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [formula, setFormula] = useState('');

    useEffect(() => {
        if (dataUpdate && Object.keys(dataUpdate).length > 0) {
            setName(dataUpdate.name);
            setCode(dataUpdate.code);
            setDescription(dataUpdate.description || '');
            setFormula(dataUpdate.formula);
        }
    }, [dataUpdate]);

    const handleClose = () => {
        setShow(false);
        resetForm();
        resetUpdateData();
    };

    const resetForm = () => {
        setName('');
        setCode('');
        setDescription('');
        setFormula('');
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

    const handleSubmitUpdate = async () => {
        if (!name || !code || !formula) {
            toast.error("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        const res = await putUpdatePromotionType(dataUpdate.id, name, code, description, formula);
        if (res && res.EC === 0) {
            toast.success(res.EM);
            handleClose();
            await fetchListWithPaginate(currentPage, searchType, searchTerm);
        } else {
            toast.error(res?.EM || "Lỗi cập nhật");
        }
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" backdrop="static" className='modal-add-user'>
            <Modal.Header closeButton>
                <Modal.Title>Cập nhật loại khuyến mãi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form className="row g-3">
                    <div className="col-md-12">
                        <label className="form-label">Tên loại khuyến mãi</label>
                        <input
                            type="text"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="col-md-12">
                        <label className="form-label">Loại khuyến mãi</label>
                        <select
                            className="form-select"
                            value={code}
                            onChange={(e) => handleCodeChange(e.target.value)}
                        >
                            <option value="percentage">Giảm theo phần trăm</option>
                            <option value="fixed_amount">Giảm số tiền cố định</option>
                            <option value="custom_price">Giá khuyến mại cố định</option>
                        </select>
                    </div>

                    <div className="col-md-12">
                        <label className="form-label">Mô tả</label>
                        <input
                            type="text"
                            className="form-control"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>


                    <input type="hidden" value={formula} readOnly />
                </form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Đóng</Button>
                <Button variant="primary" onClick={handleSubmitUpdate}>Lưu thay đổi</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalUpdatePromotionType;

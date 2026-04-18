import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { toast } from 'react-toastify';
import { updateAdminReply } from '../../../services/apiReviewService';
import { useSelector } from 'react-redux';

const ModalUpdateReply = ({ show, setShow, dataEdit, fetchListWithPaginate, currentPage }) => {
    const [comment, setComment] = useState('');
    const account = useSelector(state => state.admin.account);
    useEffect(() => {
        if (dataEdit) setComment(dataEdit.comment);
    }, [dataEdit]);

    const handleClose = () => {
        setShow(false);
        setComment('');
    };

    const handleSubmit = async () => {

        const res = await updateAdminReply(dataEdit.id, comment, account.id);
        if (res.EC === 0) {
            toast.success(res.EM);
            handleClose();
            fetchListWithPaginate(currentPage);
        } else toast.error(res.EM);
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Cập nhật phản hồi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Control
                    as="textarea"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Nội dung phản hồi..."
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                <Button variant="primary" onClick={handleSubmit}>Cập nhật</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalUpdateReply;

import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { toast } from 'react-toastify';
import { replyToReview } from '../../../services/apiReviewService';
import { useSelector } from 'react-redux';

const ModalReplyReview = ({ show, setShow, dataCreate, fetchListWithPaginate, currentPage }) => {
    const [comment, setComment] = useState('');
    const account = useSelector(state => state.admin.account);
    const handleClose = () => {
        setShow(false);
        setComment('');
    };

    const handleSubmit = async () => {

        const res = await replyToReview(dataCreate.id, comment, account.id, dataCreate.product_id);
        if (res.EC === 0) {
            toast.success(res.EM);
            handleClose();
            fetchListWithPaginate(currentPage);
        } else toast.error(res.EM);
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Phản hồi đánh giá</Modal.Title>
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
                <Button variant="primary" onClick={handleSubmit}>Gửi</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalReplyReview;

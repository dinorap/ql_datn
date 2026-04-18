import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { deleteUserReview } from '../../../services/apiReviewService';


const ModalDeleteReview = ({ show, setShow, dataDelete, fetchListWithPaginate, currentPage }) => {
    const handleClose = () => setShow(false);

    const handleSubmit = async () => {
        const res = await deleteUserReview(dataDelete.id);
        if (res.EC === 0) {
            toast.success(res.EM);
            handleClose();
            fetchListWithPaginate(currentPage);
        } else toast.error(res.EM);
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Xác nhận xóa đánh giá?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Bạn có chắc muốn xóa đánh giá của <b>{dataDelete?.usename}</b> không?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                <Button variant="danger" onClick={handleSubmit}>Xác nhận</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalDeleteReview;

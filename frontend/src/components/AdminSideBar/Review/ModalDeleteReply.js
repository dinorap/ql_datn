import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { deleteAdminReply } from '../../../services/apiReviewService';


const ModalDeleteReply = ({ show, setShow, dataDelete, fetchListWithPaginate, currentPage }) => {
    const handleClose = () => setShow(false);

    const handleSubmit = async () => {
        const res = await deleteAdminReply(dataDelete.id);
        if (res.EC === 0) {
            toast.success(res.EM);
            handleClose();
            fetchListWithPaginate(currentPage);
        } else toast.error(res.EM);
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Xác nhận xóa phản hồi?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Bạn có chắc muốn xóa phản hồi của <b>{dataDelete?.username}</b> không?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                <Button variant="danger" onClick={handleSubmit}>Xác nhận</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalDeleteReply;

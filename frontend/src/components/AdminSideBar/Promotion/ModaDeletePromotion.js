import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { deletePromotionType } from '../../../services/apiPromotionService';
const ModaDeletePromotion = (props) => {
    const { show, setShow, dataDelete, searchType, searchTerm } = props;

    const handleClose = () => {
        setShow(false)
    };

    const handleSubmitDeleteAdvertise = async () => {
        let data = await deletePromotionType(dataDelete.id)

        if (data && data.EC === 0) {
            toast.success(data.EM);
            handleClose();
            await props.fetchListWithPaginate(props.currentPage, searchType, searchTerm);
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
        }
    };
    return (
        <>
            <Modal show={show} onHide={handleClose} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa khuyến mại ?</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn xóa khuyến mại <b>{dataDelete && dataDelete.name ? dataDelete.name : ""}</b> này không ?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Hủy bỏ
                    </Button>
                    <Button variant="primary" onClick={() => handleSubmitDeleteAdvertise()}>
                        Xác nhận
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModaDeletePromotion;
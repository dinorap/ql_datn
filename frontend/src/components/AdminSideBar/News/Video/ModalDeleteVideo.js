import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { deleteNews } from '../../../../services/apiNewsService';
const ModalDeleteVideo = (props) => {
    const { show, setShow, dataDelete, searchTerm, searchType } = props;

    const handleClose = () => {
        setShow(false)
    };

    const handleSubmitDeleteAdvertise = async () => {
        let data = await deleteNews(dataDelete.id)

        if (data && data.EC === 0) {
            toast.success(data.EM);
            handleClose();
            await props.fetchListWithPaginate(props.currentPage, searchTerm, searchType);
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
        }
    };
    return (
        <>
            <Modal show={show} onHide={handleClose} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa tin tức ?</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn xóa tin tức <b>{dataDelete && dataDelete.name ? dataDelete.name : ""}</b> này không ?</Modal.Body>
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

export default ModalDeleteVideo;
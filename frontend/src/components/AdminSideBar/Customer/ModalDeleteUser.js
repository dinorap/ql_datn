import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { delDeleteUser } from '../../../services/apiAdminService';
import { toast } from 'react-toastify';

const ModalDeleteUser = (props) => {
    const { show, setShow, dataDelete } = props;

    const handleClose = () => {
        setShow(false)
    };

    const handleSubmitDeleteUSer = async () => {
        let data = await delDeleteUser(dataDelete.id)

        if (data && data.EC === 0) {
            toast.success(data.EM);
            handleClose();
            await props.fetchListUsersWithPaginate(props.currentPage, props.searchType, props.searchTerm);
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
        }
    };
    return (
        <>
            <Modal show={show} onHide={handleClose} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa người dùng ?</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn có chắc chắn muốn xóa người dùng <b>{dataDelete && dataDelete.username ? dataDelete.username : ""}</b> này không ?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Hủy bỏ
                    </Button>
                    <Button variant="primary" onClick={() => handleSubmitDeleteUSer()}>
                        Xác nhận
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalDeleteUser;
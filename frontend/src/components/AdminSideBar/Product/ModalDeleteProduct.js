import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { toast } from 'react-toastify';
import { deleteProduct } from '../../../services/apiProductService';

const ModalDeleteProduct = (props) => {
    const { show, setShow, dataDelete, type, currentPage, fetchListWithPaginate, searchType, searchTerm } = props;

    const handleClose = () => setShow(false);

    const handleDelete = async () => {
        const res = await deleteProduct(type, dataDelete.id);

        if (res?.EC === 0) {
            toast.success(res.EM);
            handleClose();
            await fetchListWithPaginate(currentPage, searchType, searchTerm);
        } else {
            toast.error(res.EM || "Có lỗi xảy ra");
        }
    };

    const getItemLabel = () => {
        if (type === 'product') return `sản phẩm "${dataDelete?.name}"`;
        if (type === 'variant') return `biến thể mã "${dataDelete?.variant_code}"`;
        if (type === 'option') return `tùy chọn RAM/ROM "${dataDelete?.ram}/${dataDelete?.rom}"`;
        return 'mục này';
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Xác nhận xóa</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Bạn có chắc chắn muốn xóa {getItemLabel()} không?
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Hủy</Button>
                <Button variant="danger" onClick={handleDelete}>Xác nhận</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalDeleteProduct;

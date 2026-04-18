import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import './Advertise.scss'
import { FcPlus } from 'react-icons/fc'
import { toast } from 'react-toastify';
import { putUpdateAdvertise } from '../../../services/apiAdvertise';


const ModalUpdateAdvertise = (props) => {
    const { show, setShow, dataUpdate, searchType, searchTerm } = props;
    const handleClose = () => {
        setShow(false)
        setName("")
        setLink("")

        setBanner(0)
        setImage("")
        setPreviewImage("")
        props.resetUpdateData()
    };
    useEffect(() => {
        if (dataUpdate && Object.keys(dataUpdate).length > 0) {
            setName(dataUpdate.name);
            setLink(dataUpdate.link);
            setBanner(dataUpdate.banner);

            if (dataUpdate.image) {

                setPreviewImage(`${process.env.REACT_APP_BASE_URL}${dataUpdate.image}`);
            }
            else {
                setPreviewImage('')
            }
        }
    }, [dataUpdate]);
    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [image, setImage] = useState("");
    const [banner, setBanner] = useState(0);
    const [previewImage, setPreviewImage] = useState("");
    const [isRemoveAvatar, setIsRemoveAvatar] = useState(false);
    const handleUploadImage = (event) => {
        if (event.target && event.target.files && event.target.files[0]) {
            setPreviewImage(URL.createObjectURL(event.target.files[0]))
            setImage(event.target.files[0])
        }
    }
    const handleSubmitUpdateAdvertise = async () => {
        let data = await putUpdateAdvertise(dataUpdate.id, name, link, image, banner, isRemoveAvatar)
        if (data && data.EC === 0) {
            toast.success(data.EM);
            handleClose();
            await props.fetchListWithPaginate(props.currentPage, searchTerm, searchType);
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
        }
    }
    return (
        <>
            <Modal show={show} onHide={handleClose} size='xl' backdrop='static' className='modal-add-user'>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật banner</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Name</label>
                            <input type="text" className="form-control"
                                value={name} onChange={(event) => setName(event.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Link</label>
                            <input type="text" className="form-control"
                                value={link} onChange={(event) => setLink(event.target.value)} />
                        </div>

                        <div className="col-md-4">
                            <label className="form-label">Banner</label>
                            <select className="form-select" value={banner} onChange={(event) => setBanner(event.target.value)}>
                                <option value="0">0</option>
                                <option value="1">1</option>
                            </select>
                        </div>

                        <div className="col-md-12 d-flex gap-3 align-items-center">
                            <label className="form-label label-upload" style={{ height: "45px", marginBottom: "0px" }} htmlFor='labelupload'>
                                <FcPlus />Upload File Image
                            </label>
                            <input type="file" id='labelupload' hidden
                                onChange={(event) => handleUploadImage(event)} />

                            {previewImage &&
                                <Button variant="danger" className="" style={{ height: "45px" }}
                                    onClick={() => {
                                        setPreviewImage("");
                                        setImage("");
                                        setIsRemoveAvatar(true);
                                    }}>
                                    Xóa ảnh
                                </Button>}
                        </div>
                        <div className="col-md-12 img-preview">
                            {previewImage ? <img src={previewImage} /> : <span>Preview Image</span>}
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => handleSubmitUpdateAdvertise()}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
export default ModalUpdateAdvertise;
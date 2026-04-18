import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import './Advertise.scss'
import { FcPlus } from 'react-icons/fc'
import { toast } from 'react-toastify';
import { postCreateNewAdvertise } from '../../../services/apiAdvertise';

const ModalCreateAdvertise = (props) => {
    const { show, setShow } = props;
    const handleClose = () => {
        setName("")
        setShow(false)
        setLink("")
        setBanner(0)
        setImage("")
        setPreviewImage("")
    };

    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [image, setImage] = useState("");
    const [banner, setBanner] = useState(0);
    const [previewImage, setPreviewImage] = useState("");

    const handleUploadImage = (event) => {
        if (event.target && event.target.files && event.target.files[0]) {
            setPreviewImage(URL.createObjectURL(event.target.files[0]))
            setImage(event.target.files[0])
        }
    }

    const handleSubmitCreateAdvertise = async () => {

        let data = await postCreateNewAdvertise(name, link, image, banner)


        if (data && data.EC === 0) {
            toast.success(data.EM);
            handleClose();
            props.setCurrentPage(1)
            await props.fetchListWithPaginate(1);
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
        }
    }
    return (
        <>
            <Modal show={show} onHide={handleClose} size='xl' backdrop='static' className='modal-add-user'>
                <Modal.Header closeButton>
                    <Modal.Title>Thêm banner mới</Modal.Title>
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
                            <select className="form-select" onChange={(event) => setBanner(event.target.value)}>
                                <option value="0">0</option>
                                <option value="1">1</option>
                            </select>
                        </div>

                        <div className="col-md-12">
                            <label className="form-label label-upload" htmlFor='labelupload'>
                                <FcPlus />Upload File Image
                            </label>
                            <input type="file" id='labelupload' hidden
                                onChange={(event) => handleUploadImage(event)} />
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
                    <Button variant="primary" onClick={() => handleSubmitCreateAdvertise()}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
export default ModalCreateAdvertise;
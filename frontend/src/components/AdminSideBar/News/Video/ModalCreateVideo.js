import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import './Video.scss'
import { toast } from 'react-toastify';
import { postCreateNewNews } from '../../../../services/apiNewsService';
const ModalCreateVideo = (props) => {
    const { show, setShow } = props;
    const handleClose = () => {
        setName("")
        setShow(false)
        setLink("")
        setLinkVideo('')
        setAuthor('')
        setDescription('')
    };
    const [description, setDescription] = useState("");
    const [author, setAuthor] = useState("");
    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [linkVideo, setLinkVideo] = useState("");

    const handleSubmitCreateAdvertise = async () => {

        let data = await postCreateNewNews(name, link, null, 1, linkVideo, author, description);
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
                    <Modal.Title>Thêm video tin tức mới</Modal.Title>
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
                        <div className="col-md-6">
                            <label className="form-label">Link Video</label>
                            <input type="text" className="form-control"
                                value={linkVideo} onChange={(event) => setLinkVideo(event.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Tác giả</label>
                            <input type="text" className="form-control"
                                value={author} onChange={(event) => setAuthor(event.target.value)} />
                        </div>
                        <div className="col-md-16">
                            <label className="form-label">Mô tả</label>
                            <textarea
                                className="form-control"
                                rows={4} value={description}
                                onChange={(event) => setDescription(event.target.value)}
                            />
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
export default ModalCreateVideo;
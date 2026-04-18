import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import './Video.scss'
import { toast } from 'react-toastify';
import { putUpdateNews } from '../../../../services/apiNewsService';


const ModalUpdateVideo = (props) => {
    const { show, setShow, dataUpdate, searchTerm, searchType } = props;
    const handleClose = () => {
        setShow(false)
        setName('')
        setLink('')
        setLinkVideo('')
        setAuthor('')
        setDescription('')
        props.resetUpdateData()
    };
    useEffect(() => {

        if (dataUpdate && Object.keys(dataUpdate).length > 0) {
            setName(dataUpdate.name);
            setLink(dataUpdate.link);
            setLinkVideo(dataUpdate.linkvideo)
            setAuthor(dataUpdate.author)
            setDescription(dataUpdate.description)
        }
    }, [dataUpdate]);
    const [description, setDescription] = useState("");
    const [name, setName] = useState("");
    const [link, setLink] = useState("");
    const [linkVideo, setLinkVideo] = useState("");
    const [author, setAuthor] = useState("");
    const handleSubmitUpdateAdvertise = async () => {
        let data = await putUpdateNews(dataUpdate.id, name, link, null, 1, 0, linkVideo, author, description)
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
                    <Button variant="primary" onClick={() => handleSubmitUpdateAdvertise()}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
export default ModalUpdateVideo;
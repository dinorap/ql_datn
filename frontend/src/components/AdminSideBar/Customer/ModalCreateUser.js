import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import './Customer.scss'
import { FcPlus } from 'react-icons/fc'
import { toast } from 'react-toastify';
import { postCreateNewUser } from '../../../services/apiAdminService';

const ModalCreatUser = (props) => {
    const { show, setShow } = props;
    const handleClose = () => {
        setShow(false)
        setEmail("")
        setPassword("")
        setUsername("")
        setRole("USER")
        setAvatar("")
        setPreviewAvatar("")
    };

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("USER");
    const [avatar, setAvatar] = useState("");
    const [previewAvatar, setPreviewAvatar] = useState("");

    const handleUploadImage = (event) => {
        if (event.target && event.target.files && event.target.files[0]) {
            setPreviewAvatar(URL.createObjectURL(event.target.files[0]))
            setAvatar(event.target.files[0])
        }
    }

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
    };
    const handleSubmitCreateUser = async () => {
        if (!validateEmail(email)) {
            toast.error("Email không hợp lệ")
            return;
        }
        if (!password) {
            toast.error("Mật khẩu không hợp lệ")
            return;
        }

        let data = await postCreateNewUser(email, password, username, role, avatar)


        if (data && data.EC === 0) {
            toast.success(data.EM);
            handleClose();
            props.setCurrentPage(1)
            await props.fetchListUsersWithPaginate(1);
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
        }
    }
    return (
        <>
            <Modal show={show} onHide={handleClose} size='xl' backdrop='static' className='modal-add-user'>
                <Modal.Header closeButton>
                    <Modal.Title>Add new user</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-control"
                                value={email} onChange={(event) => setEmail(event.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Mật khẩu</label>
                            <input type="password" className="form-control"
                                value={password} onChange={(event) => setPassword(event.target.value)} />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Username</label>
                            <input type="text" className="form-control"
                                value={username} onChange={(event) => setUsername(event.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Quyền</label>
                            <select className="form-select" onChange={(event) => setRole(event.target.value)}>
                                <option value="USER">USER</option>
                                <option value="STAFF">STAFF</option>
                                <option value="PRODUCT_MANAGER">PRODUCT_MANAGER</option>
                                <option value="MARKETER">MARKETER</option>
                                <option value="EDITOR">EDITOR</option>
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
                            {previewAvatar ? <img src={previewAvatar} /> : <span>Preview Image</span>}
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={() => handleSubmitCreateUser()}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
export default ModalCreatUser;
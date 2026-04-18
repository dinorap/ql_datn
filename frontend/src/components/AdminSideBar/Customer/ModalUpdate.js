import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { FcPlus } from 'react-icons/fc'
import { toast } from 'react-toastify';

import './Customer.scss'
import { putUpdateUser, getUserById } from '../../../services/apiAdminService';
import { aupdateAccount } from '../../../redux/slices/userSlice'
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
const ModalUpdateUser = (props) => {
    const { show, setShow, dataUpdate } = props;
    const dispatch = useDispatch();
    const handleClose = () => {
        setShow(false)
        setEmail("")
        setPassword("")
        setUsername("")
        setRole("")
        setAvatar("")
        setPreviewAvatar("")
        props.resetUpdateData()
    }
    const currentAdminId = useSelector(state => state.admin.account?.id);
    useEffect(() => {
        if (dataUpdate && Object.keys(dataUpdate).length > 0) {
            setEmail(dataUpdate.email);
            setUsername(dataUpdate.username);
            setRole(dataUpdate.role);

            if (dataUpdate.avatar) {
                setPreviewAvatar(`${process.env.REACT_APP_BASE_URL}${dataUpdate.avatar}`);

            }
            else {
                setPreviewAvatar('')
            }
        }
    }, [dataUpdate]);

    const handleUploadImage = (event) => {
        if (event.target && event.target.files && event.target.files[0]) {
            setPreviewAvatar(URL.createObjectURL(event.target.files[0]))
            setAvatar(event.target.files[0])
            setIsRemoveAvatar(false);
        }
    }
    const handleSubmitUpdateUser = async () => {
        let data = await putUpdateUser(dataUpdate.id, email, username, role, avatar, isRemoveAvatar)
        if (data && data.EC === 0) {
            toast.success(data.EM);
            if (dataUpdate.id === currentAdminId) {
                const datalogin = await getUserById(dataUpdate.id);

                if (datalogin.EC === 0) {

                    dispatch(aupdateAccount(datalogin.data));
                }
            }
            handleClose();
            await props.fetchListUsersWithPaginate(props.currentPage, props.searchType, props.searchTerm);
        }
        if (data && data.EC !== 0) {
            toast.error(data.EM);
        }
    }
    const [previewAvatar, setPreviewAvatar] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("user");
    const [avatar, setAvatar] = useState("");
    const [isRemoveAvatar, setIsRemoveAvatar] = useState(false);

    return (
        <>
            <Modal show={show} onHide={handleClose} size='xl' backdrop='static' className='modal-add-user'>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật người dùng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-control"
                                value={email} onChange={(event) => setEmail(event.target.value)} />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-control"
                                value={password} disabled />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Username</label>
                            <input type="text" className="form-control"
                                value={username} onChange={(event) => setUsername(event.target.value)} />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Quyền</label>
                            <select className="form-select" value={role} onChange={(event) => setRole(event.target.value)}>
                                <option value="USER">USER</option>
                                <option value="STAFF">STAFF</option>
                                <option value="PRODUCT_MANAGER">PRODUCT_MANAGER</option>
                                <option value="MARKETER">MARKETER</option>
                                <option value="EDITOR">EDITOR</option>
                            </select>
                        </div>
                        <div className="col-md-12 d-flex gap-3 align-items-center">
                            <label className="form-label label-upload" style={{ height: "45px", marginBottom: "0px" }} htmlFor='labelupload'>
                                <FcPlus />Upload File Image
                            </label>
                            <input type="file" id='labelupload' hidden
                                onChange={(event) => handleUploadImage(event)} />
                            {previewAvatar &&
                                <Button variant="danger" className="" style={{ height: "45px" }}
                                    onClick={() => {
                                        setPreviewAvatar("");
                                        setAvatar("");
                                        setIsRemoveAvatar(true);
                                    }}>
                                    Xóa ảnh
                                </Button>}
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
                    <Button variant="primary" onClick={() => handleSubmitUpdateUser()}>
                        Save
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
export default ModalUpdateUser;
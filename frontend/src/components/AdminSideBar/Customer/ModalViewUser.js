import { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import './Customer.scss'
import { Image } from 'antd';
import { data } from 'react-router-dom';
const ModalViewUser = (props) => {
    const { show, setShow, dataView } = props;

    const handleClose = () => {
        setShow(false)
        setEmail("")
        setPassword("")
        setUsername("")
        setRole("")
        setAvatar("")
        props.resetViewData()
    }

    useEffect(() => {
        if (dataView && Object.keys(dataView).length > 0) {

            setEmail(dataView.email);
            setUsername(dataView.username);
            setRole(dataView.role);
            if (dataView.avatar) {
                setAvatar(`${process.env.REACT_APP_BASE_URL}${dataView.avatar}`);
            }
            else {
                setAvatar('')
            }
        }
    }, [dataView]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("USER");
    const [avatar, setAvatar] = useState("");
    return (
        <>
            <Modal show={show} onHide={handleClose} size='xl' backdrop='static' className='modal-add-user'>
                <Modal.Header closeButton>
                    <Modal.Title>Update user</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input type="email" className="form-control"
                                value={email} disabled />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label">Password</label>
                            <input type="password" className="form-control"
                                value={password} disabled />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label">Username</label>
                            <input type="text" className="form-control"
                                value={username} disabled />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">ROLE</label>
                            <select className="form-select" value={role} disabled>
                                <option value="user">USER</option>
                                <option value="admin">ADMIN</option>
                            </select>
                        </div>
                        <div className="col-md-12 img-preview">
                            {avatar ? <Image className='user-image' src={avatar} alt='avatar' /> : <span>Preview Image</span>}

                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
export default ModalViewUser;
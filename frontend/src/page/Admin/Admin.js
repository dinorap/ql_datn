import SideBar from '../../components/AdminSideBar/SideBar';
import './Admin.scss';
import { Outlet } from 'react-router-dom';

function Admin() {
    return (
        <div className="app-container">
            <SideBar />
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    );
}

export default Admin;
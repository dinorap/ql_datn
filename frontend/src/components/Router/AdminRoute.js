import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children, allowedRoles }) => {
    const isAuthenticated = useSelector(state => state.admin.isAuthenticated);
    const role = useSelector(state => state.admin.account?.role);
    if (!isAuthenticated || role === "user") {
        return <Navigate to="/" replace />;
    }
    if (!isAuthenticated || (allowedRoles && !allowedRoles.includes(role))) {
        return <Navigate to="/ac" replace />;
    }

    return children;
};

export default AdminRoute;

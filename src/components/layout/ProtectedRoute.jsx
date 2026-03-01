import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="auth-loading">
                <div className="auth-loading__spinner" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

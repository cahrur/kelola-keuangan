import Modal from './Modal';
import Button from './Button';
import './ConfirmDialog.css';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Hapus', variant = 'danger' }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <p className="confirm-dialog__message">{message}</p>
            <div className="confirm-dialog__actions">
                <Button variant="secondary" onClick={onClose} fullWidth>
                    Batal
                </Button>
                <Button variant={variant} onClick={onConfirm} fullWidth>
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
}

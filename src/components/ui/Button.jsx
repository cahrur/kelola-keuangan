import './Button.css';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    icon,
}) {
    return (
        <button
            type={type}
            className={`btn btn--${variant} btn--${size} ${fullWidth ? 'btn--full' : ''} ${className}`}
            disabled={disabled}
            onClick={onClick}
        >
            {icon && <span className="btn__icon">{icon}</span>}
            {children}
        </button>
    );
}

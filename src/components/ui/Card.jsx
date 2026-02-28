import './Card.css';

export default function Card({ children, className = '', glow = false, onClick, style }) {
    return (
        <div
            className={`card ${glow ? 'card--glow' : ''} ${onClick ? 'card--clickable' : ''} ${className}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    );
}

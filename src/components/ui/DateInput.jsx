import { useRef } from 'react';

/**
 * DateInput — wraps native date picker but shows dd-mm-yyyy display.
 * value prop is yyyy-mm-dd (ISO), onChange returns ISO.
 */
export default function DateInput({ value, onChange, required, placeholder = 'dd-mm-yyyy', ...rest }) {
    const inputRef = useRef(null);

    const toDisplay = (iso) => {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${d}-${m}-${y}`;
    };

    const openPicker = () => {
        inputRef.current?.showPicker?.();
        inputRef.current?.focus();
    };

    return (
        <div className="date-input-wrapper" onClick={openPicker}>
            <span className={`date-input-display ${!value ? 'date-input-display--placeholder' : ''}`}>
                {value ? toDisplay(value) : placeholder}
            </span>
            <input
                ref={inputRef}
                type="date"
                className="date-input-hidden"
                value={value || ''}
                onChange={onChange}
                required={required}
                {...rest}
            />
        </div>
    );
}

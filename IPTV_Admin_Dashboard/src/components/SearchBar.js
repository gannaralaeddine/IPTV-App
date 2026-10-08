import React from 'react';

const SearchBar = ({
    value,
    onChange,
    placeholder = 'Search...',
    onClear,
    className = '',
    style = {}
}) => {
    return (
        <div
            className={`input-group input-group-sm ${className}`}
            style={{ width: '240px', maxWidth: '100%', ...style }}
        >
            <span className="input-group-text bg-white border-end-0 text-muted">
                <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <input
                type="text"
                className="form-control border-start-0 ps-1"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={placeholder}
            />
            {value && (
                <button
                    className="btn btn-outline-secondary border-start-0 bg-white text-muted"
                    type="button"
                    onClick={() => {
                        onChange('');
                        if (onClear) onClear();
                    }}
                    title="Clear search"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            )}
        </div>
    );
};

export default SearchBar;

import React from 'react';
import './Input.css';

const Input = ({
  id,
  label,
  control,
  type,
  required,
  value,
  placeholder,
  rows,
  valid,
  touched,
  onChange,
  onBlur
}) => {
  const inputClasses = [
    valid ? 'valid' : 'invalid',
    touched ? 'touched' : 'untouched'
  ].join(' ');

  return (
    <div className="input">
      {label && <label htmlFor={id}>{label}</label>}
      {control === 'input' && (
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          className={inputClasses}
          onChange={e => onChange(id, e.target.value, e.target.files)}
          onBlur={onBlur}
        />
      )}
      {control === 'textarea' && (
        <textarea
          id={id}
          rows={rows}
          required={required}
          value={value}
          placeholder={placeholder}
          className={inputClasses}
          onChange={e => onChange(id, e.target.value)}
          onBlur={onBlur}
        />
      )}
    </div>
  );
};

export default Input;

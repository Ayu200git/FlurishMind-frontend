import React from 'react';
import './Input.css';

const FilePicker = ({ id, label, valid, touched, onChange, onBlur }) => {
  const inputClasses = [
    valid ? 'valid' : 'invalid',
    touched ? 'touched' : 'untouched'
  ].join(' ');

  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input
        type="file"
        id={id}
        accept="image/png, image/jpeg, image/jpg"
        className={inputClasses}
        onChange={e => onChange(id, e.target.value, e.target.files)}
        onBlur={onBlur}
      />
    </div>
  );
};

export default FilePicker;

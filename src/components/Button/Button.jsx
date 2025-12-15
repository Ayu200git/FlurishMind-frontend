import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

const Button = ({
  link,
  design,
  mode,
  onClick,
  disabled,
  loading,
  type,
  children
}) => {
  const classes = ['button', `button--${design}`, `button--${mode}`].join(' ');

  if (!link) {
    return (
      <button
        className={classes}
        onClick={onClick}
        disabled={disabled || loading}
        type={type}
      >
        {loading ? 'Loading...' : children}
      </button>
    );
  } else {
    return (
      <Link className={classes} to={link}>
        {children}
      </Link>
    );
  }
};

export default Button;

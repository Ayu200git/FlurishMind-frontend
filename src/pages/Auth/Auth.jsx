import React from 'react';
import './Auth.css';

const Auth = ({ children }) => (
  <div className="auth-page">
    <section className="auth-form">{children}</section>
  </div>
);

export default Auth;

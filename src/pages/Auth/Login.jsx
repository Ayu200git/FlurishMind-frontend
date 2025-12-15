import React, { useState } from 'react';
import Input from '../../components/Form/Input/Input';
import Button from '../../components/Button/Button';
import { required, length, email as emailValidator } from '../../util/validators';
import Auth from './Auth';

const Login = ({ onLogin, loading }) => {
  const [loginForm, setLoginForm] = useState({
    email: {
      value: '',
      valid: false,
      touched: false,
      validators: [required, emailValidator]
    },
    password: {
      value: '',
      valid: false,
      touched: false,
      validators: [required, length({ min: 5 })]
    },
    formIsValid: false
  });

  const inputChangeHandler = (input, value) => {
    setLoginForm(prevForm => {
      let isValid = true;
      for (const validator of prevForm[input].validators) {
        isValid = isValid && validator(value);
      }

      const updatedForm = {
        ...prevForm,
        [input]: {
          ...prevForm[input],
          value: value,
          valid: isValid
        }
      };

      let formIsValid = true;
      for (const inputName in updatedForm) {
        if (inputName === 'formIsValid') continue;
        formIsValid = formIsValid && updatedForm[inputName].valid;
      }

      return { ...updatedForm, formIsValid };
    });
  };

  const inputBlurHandler = input => {
    setLoginForm(prevForm => ({
      ...prevForm,
      [input]: {
        ...prevForm[input],
        touched: true
      }
    }));
  };

  const submitHandler = e => {
    e.preventDefault();
    onLogin(e, {
      email: loginForm.email.value,
      password: loginForm.password.value
    });
  };

  return (
    <Auth>
      <form onSubmit={submitHandler} noValidate>
        <Input
          id="email"
          name="email"
          label="Your E-Mail"
          type="email"
          control="input"
          onChange={inputChangeHandler}
          onBlur={() => inputBlurHandler('email')}
          value={loginForm.email.value}
          valid={loginForm.email.valid}
          touched={loginForm.email.touched}
          autoComplete="email"
          required
        />
        <Input
          id="password"
          name="password"
          label="Password"
          type="password"
          control="input"
          onChange={inputChangeHandler}
          onBlur={() => inputBlurHandler('password')}
          value={loginForm.password.value}
          valid={loginForm.password.valid}
          touched={loginForm.password.touched}
          autoComplete="current-password"
          required
        />
        <Button design="raised" type="submit" loading={loading}>
          Login
        </Button>
      </form>
    </Auth>
  );
};

export default Login;

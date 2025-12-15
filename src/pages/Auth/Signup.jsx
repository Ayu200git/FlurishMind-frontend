import React, { useState } from 'react';
import Input from '../../components/Form/Input/Input';
import Button from '../../components/Button/Button';
import { required, length, email } from '../../util/validators';
import Auth from './Auth';

const Signup = ({ onSignup, loading }) => {
  const [signupForm, setSignupForm] = useState({
    email: { value: '', valid: false, touched: false, validators: [required, email] },
    name: { value: '', valid: false, touched: false, validators: [required] },
    password: { value: '', valid: false, touched: false, validators: [required, length({ min: 5 })] },
    formIsValid: false
  });

  const inputChangeHandler = (input, value) => {
    setSignupForm(prevForm => {
      let isValid = true;
      for (const validator of prevForm[input].validators) isValid = isValid && validator(value);

      const updatedForm = { 
        ...prevForm, 
        [input]: { ...prevForm[input], value, valid: isValid } 
      };

      let formIsValid = true;
      for (const key in updatedForm) {
        if (updatedForm[key].hasOwnProperty('valid')) formIsValid = formIsValid && updatedForm[key].valid;
      }

      return { ...updatedForm, formIsValid };
    });
  };

  const inputBlurHandler = input => {
    setSignupForm(prevForm => ({
      ...prevForm,
      [input]: { ...prevForm[input], touched: true }
    }));
  };

  const submitHandler = e => {
    e.preventDefault();
    const formData = {
      email: signupForm.email.value,
      name: signupForm.name.value,
      password: signupForm.password.value
    };
    onSignup(e, formData); // send only values
  };

  return (
    <Auth>
      <form onSubmit={submitHandler}>
        <Input
          id="email"
          label="Your E-Mail"
          type="email"
          control="input"
          onChange={inputChangeHandler}
          onBlur={() => inputBlurHandler('email')}
          value={signupForm.email.value}
          valid={signupForm.email.valid}
          touched={signupForm.email.touched}
        />
        <Input
          id="name"
          label="Your Name"
          type="text"
          control="input"
          onChange={inputChangeHandler}
          onBlur={() => inputBlurHandler('name')}
          value={signupForm.name.value}
          valid={signupForm.name.valid}
          touched={signupForm.name.touched}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          control="input"
          onChange={inputChangeHandler}
          onBlur={() => inputBlurHandler('password')}
          value={signupForm.password.value}
          valid={signupForm.password.valid}
          touched={signupForm.password.touched}
        />
        <Button design="raised" type="submit" loading={loading}>
          Signup
        </Button>
      </form>
    </Auth>
  );
};

export default Signup;

import React, { useState } from 'react'
import './CSS/Login.css'

const Login = () => {
  const [state, setState] = useState('Login')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
  })

  const changeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const login = async () => {
    console.log('Login funcion Executed', formData)
    let responseData
    await fetch('http://localhost:4000/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => (responseData = data))

    if (responseData.success) {
      localStorage.setItem('auth-token', responseData.token)
      window.location.replace('/')
    } else {
      alert(responseData.errors)
    }
  }

  const signup = async () => {
    console.log('signup funcion Executed', formData)
    let responseData
    await fetch('http://localhost:4000/signup', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => (responseData = data))

    if (responseData.success) {
      localStorage.setItem('auth-token', responseData.token)
      window.location.replace('/')
    } else {
      alert(responseData.errors)
    }
  }

  return (
    <div className='loginSignin'>
      <div className='loginSignup-container'>
        <h1>{state}</h1>
        <div className='loginSignup-fields'>
          {state === 'Sign Up' ? (
            <input
              name='username'
              value={formData.username}
              onChange={changeHandler}
              type='text'
              placeholder='Your Name'
            />
          ) : (
            <></>
          )}

          <input
            name='email'
            value={formData.email}
            onChange={changeHandler}
            type='email'
            placeholder='Email Address'
          />
          <input
            name='password'
            value={formData.password}
            onChange={changeHandler}
            type='password'
            placeholder='Password'
          />
        </div>
        <button
          onClick={() => {
            state === 'Login' ? login() : signup()
          }}
        >
          Continue
        </button>
        {state === 'Sign Up' ? (
          <p className='loginSignup-login'>
            Already have an account?{' '}
            <span
              onClick={() => {
                setState('Login')
              }}
            >
              Login here
            </span>
          </p>
        ) : (
          <p className='loginSignup-login'>
            Create an account?{' '}
            <span
              onClick={() => {
                setState('Sign Up')
              }}
            >
              Register here
            </span>
          </p>
        )}

        <div className='loginSignup-agree'>
          <input type='checkbox' name='' id='' />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
      </div>
    </div>
  )
}

export default Login

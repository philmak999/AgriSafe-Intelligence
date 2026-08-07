import React from 'react';
import { Link } from 'react-router-dom';
import FarmerRegisterForm from '../components/FarmerRegisterForm';
import { ROUTES } from '../routes';

export default function FarmerRegister() {
  return (
    <div>
      <FarmerRegisterForm />
      <p style={{ fontSize: '12.5px', color: 'var(--gray)', marginTop: 16, textAlign: 'center' }}>
        Already registered? <Link to={ROUTES.login} style={{ color: 'var(--teal-dark)' }}>Sign in</Link>
      </p>
    </div>
  );
}

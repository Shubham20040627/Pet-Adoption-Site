import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
      <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🐾 404</div>
      <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', marginBottom: '0.75rem' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem auto', fontSize: '1.05rem' }}>
        Oops! The page you are looking for took off like an excited puppy. Let's get you back on the right trail.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link to="/" className="btn btn-primary">
          <Home size={18} /> Return Home
        </Link>
        <Link to="/pets" className="btn btn-outline">
          <Search size={18} /> Browse Pets
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;

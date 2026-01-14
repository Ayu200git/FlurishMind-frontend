import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../Image/Avatar';
import Loader from '../Loader/Loader';
import './UserProfile.css';

const UserProfile = ({ token, userId, onLogout }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!token || !userId) return;

    const fetchUser = async () => {
      setLoading(true);
      const graphqlQuery = {
        query: `
          query {
            user {
              _id
              name
              username
              email
              role
              avatar
            }
          }
        `,
      };

      try {
        const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify(graphqlQuery),
        });

        const resData = await res.json();
        if (resData.errors) throw new Error(resData.errors[0].message);

        setUser(resData.data.user);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for profile updates from other components
    window.addEventListener('profileUpdated', fetchUser);

    return () => {
      window.removeEventListener('profileUpdated', fetchUser);
    };
  }, [token, userId]);

  if (loading) {
    return (
      <div className="user-profile__loader">
        <Loader />
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getImageUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
  };

  const avatarUrl = user.avatar ? getImageUrl(user.avatar) : null;

  return (
    <div className="user-profile">
      <button
        className="user-profile__toggle"
        onClick={() => navigate(`/profile/${userId}`)}
        aria-label="Go to profile"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.name}
            className="user-profile__avatar-image"
          />
        ) : (
          <div className="user-profile__avatar">
            {initials}
          </div>
        )}
      </button>
    </div>
  );
};

export default UserProfile;


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
              status
              role
              avatar
            }
          }
        `,
      };

      try {
        const res = await fetch('http://localhost:8080/graphql', {
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

  return (
    <div className="user-profile">
      <button 
        className="user-profile__toggle"
        onClick={() => setShowProfile(!showProfile)}
        aria-label="Toggle profile"
      >
        <div className="user-profile__avatar">
          {initials}
        </div>
      </button>
      {showProfile && (
        <>
          <div className="user-profile__backdrop" onClick={() => setShowProfile(false)} />
          <div className="user-profile__dropdown">
            <div className="user-profile__header">
              <div className="user-profile__avatar-large">
                {user.avatar ? (
                  <img src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:8080/${user.avatar}`} alt={user.name} />
                ) : (
                  initials
                )}
              </div>
              <h3>{user.name}</h3>
              {user.username && <p className="user-profile__username">@{user.username}</p>}
            </div>
            <div className="user-profile__menu">
              <button 
                className="user-profile__menu-item"
                onClick={() => {
                  navigate(`/profile/${userId}`);
                  setShowProfile(false);
                }}
              >
                View Profile
              </button>
              <button 
                className="user-profile__menu-item"
                onClick={() => {
                  navigate(`/profile/${userId}?edit=true`);
                  setShowProfile(false);
                }}
              >
                Edit Profile
              </button>
              {user.role === 'admin' && (
                <button 
                  className="user-profile__menu-item"
                  onClick={() => {
                    navigate('/admin');
                    setShowProfile(false);
                  }}
                >
                  Admin Dashboard
                </button>
              )}
              <button 
                className="user-profile__menu-item user-profile__menu-item--logout"
                onClick={() => {
                  setShowProfile(false);
                  if (onLogout) onLogout();
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;


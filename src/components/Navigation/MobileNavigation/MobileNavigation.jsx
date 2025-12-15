import React from 'react';
import { NavLink } from 'react-router-dom';
import './MobileNavigation.css';

// NavigationItems component inside this file
const NavigationItems = ({ isAuth, onChoose, onLogout, onNewPost, onEdit }) => {
  const navItems = [
    { id: 'feed', text: 'Feed', link: '/', auth: true },
    { id: 'login', text: 'Login', link: '/login', auth: false },
    { id: 'signup', text: 'Signup', link: '/signup', auth: false }
  ];

  const filteredItems = navItems
    .filter(item => item.auth === isAuth)
    .map(item => (
      <li key={item.id} className="navigation-item mobile">
        <NavLink to={item.link} onClick={onChoose}>
          {item.text}
        </NavLink>
      </li>
    ));

  return (
    <>
      {filteredItems}
      {isAuth && (
        <>
          <li className="navigation-item mobile">
            <button onClick={onNewPost}>New Post</button>
          </li>
          <li className="navigation-item mobile">
            <button onClick={onEdit}>Edit</button>
          </li>
          <li className="navigation-item mobile">
            <button onClick={onLogout}>Logout</button>
          </li>
        </>
      )}
    </>
  );
};

const MobileToggle = ({ onOpen }) => (
  <button className="mobile-toggle" onClick={onOpen}>
    <span className="mobile-toggle__bar" />
    <span className="mobile-toggle__bar" />
    <span className="mobile-toggle__bar" />
  </button>
);

const MobileNavigation = ({ open, mobile, onChooseItem, onLogout, onNewPost, onEdit, isAuth }) => {
  return (
    <>
      <nav className={`mobile-nav ${open ? 'open' : ''}`}>
        <ul className="mobile-nav__items mobile">
          <NavigationItems
            isAuth={isAuth}
            onChoose={onChooseItem}
            onLogout={onLogout}
            onNewPost={onNewPost}
            onEdit={onEdit}
          />
        </ul>
      </nav>
      {open && <div className="mobile-nav__backdrop" onClick={onChooseItem}></div>}
    </>
  );
};

export default MobileNavigation;

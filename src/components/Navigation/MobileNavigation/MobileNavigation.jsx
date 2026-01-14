import React from 'react';
import { NavLink } from 'react-router-dom';
import { useViewMode } from '../../../context/ViewModeContext';
import './MobileNavigation.css';

// NavigationItems component inside this file
const NavigationItems = ({ isAuth, onChoose, onLogout, onNewPost, onEdit }) => {
  const { isListView, setIsListView } = useViewMode();
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
            <button onClick={() => { setIsListView(!isListView); onChoose(); }} style={{ fontSize: '1rem' }}>
              {isListView ? '▤ Switch to Grid View' : '☰ Switch to List View'}
            </button>
          </li>
          <li className="navigation-item mobile">
            <button onClick={() => { onNewPost(); onChoose(); }}>New Post</button>
          </li>
          <li className="navigation-item mobile">
            <button onClick={() => { onEdit(); onChoose(); }}>Edit</button>
          </li>
          <li className="navigation-item mobile">
            <NavLink to="/profile?tab=saved" onClick={onChoose} style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: 'inherit', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}>
              Saved Posts
            </NavLink>
          </li>
          <li className="navigation-item mobile">
            <button onClick={() => { onLogout(); onChoose(); }}>Logout</button>
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

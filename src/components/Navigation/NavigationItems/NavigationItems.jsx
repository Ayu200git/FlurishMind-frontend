import React from 'react';
import { NavLink } from 'react-router-dom';
import './NavigationItems.css';

const navItems = [
  { id: 'feed', text: 'Feed', link: '/', auth: true },
  { id: 'login', text: 'Login', link: '/', auth: false },
  { id: 'signup', text: 'Signup', link: '/signup', auth: false }
];

const NavigationItems = ({ isAuth, mobile, onChoose, onLogout, onNewPost, onEdit, onAdmin }) => {
  const filteredItems = navItems
    .filter(item => item.auth === isAuth)
    .map(item => (
      <li
        key={item.id}
        className={['navigation-item', mobile ? 'mobile' : ''].join(' ')}
      >
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
          <li className="navigation-item" key="new-post">
            <button onClick={onNewPost}>New Post</button>
          </li>
          <li className="navigation-item" key="edit">
            <button onClick={onEdit}>Edit</button>
          </li>
          {/* <li className='navigation-item' key="admin">
            <button onClick={onAdmin}>Admin</button>
          </li> */}

          <li className="navigation-item" key="logout">
            <button onClick={onLogout}>Logout</button>
          </li>
        </>
      )}
    </>
  );
};

export default NavigationItems;

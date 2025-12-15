import React from 'react';
import Image from './Image';
import './Avatar.css';

const Avatar = ({ size, image }) => {
  const style = {
    width: `${size}rem`,
    height: `${size}rem`
  };

  return (
    <div className="avatar" style={style}>
      <Image imageUrl={image} />
    </div>
  );
};

export default Avatar;

import React from 'react';
import './Image.css';

const Image = ({ imageUrl, contain, left }) => {
  return (
    <img
      src={imageUrl}
      className="image"
      style={{
        objectFit: contain ? 'contain' : 'cover',
        objectPosition: left ? 'left' : 'center',
        background: 'transparent'
      }}
      alt="post"
    />
  );
};

export default Image;

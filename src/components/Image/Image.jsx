import React from 'react';
import './Image.css';

const Image = ({ imageUrl, contain, left }) => {
  const style = {
    backgroundImage: `url('${imageUrl}')`,
    backgroundSize: contain ? 'contain' : 'cover',
    backgroundPosition: left ? 'left' : 'center'
  };

  return <div className="image" style={style} />;
};

export default Image;

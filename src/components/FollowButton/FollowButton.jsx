import React from 'react';
import './FollowButton.css';

const FollowButton = ({ isFollowing, isOwnProfile, onFollow, loading }) => {
    if (isOwnProfile) return null;

    return (
        <button
            className={`follow-btn ${isFollowing ? 'following' : 'follow'}`}
            onClick={onFollow}
            disabled={loading}
        >
            {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
        </button>
    );
};

export default FollowButton;

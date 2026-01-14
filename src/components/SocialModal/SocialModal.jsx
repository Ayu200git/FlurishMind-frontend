import React from 'react';
import FollowButton from '../FollowButton/FollowButton';
import './SocialModal.css';

const SocialModal = ({ isOpen, onClose, title, users, currentUserId, onFollowToggle, followingIds, loadingUserId }) => {
    if (!isOpen) return null;

    return (
        <div className="social-modal-overlay" onClick={onClose}>
            <div className="social-modal" onClick={(e) => e.stopPropagation()}>
                <div className="social-modal-header">
                    <h3>{title}</h3>
                    <button className="social-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="social-modal-body">
                    {users && users.length > 0 ? (
                        users.map(user => (
                            <div key={user._id} className="social-user-item">
                                <div className="social-user-info">
                                    {user.avatar ? (
                                        <img src={user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_BACKEND_URL}/${user.avatar}`} alt={user.name} className="social-user-avatar" />
                                    ) : (
                                        <div className="social-user-placeholder">{user.name?.[0]}</div>
                                    )}
                                    <div className="social-user-details">
                                        <span className="social-user-name">{user.name}</span>
                                        {user.username && <span className="social-user-username">@{user.username}</span>}
                                    </div>
                                </div>
                                <FollowButton
                                    isFollowing={followingIds.includes(user._id)}
                                    isOwnProfile={user._id === currentUserId}
                                    onFollow={() => onFollowToggle(user._id)}
                                    loading={loadingUserId === user._id}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="social-empty">No users to show</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialModal;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PostGridModal.css';

const PostGridModal = ({ post, posts, currentIndex, onClose, onNext, onPrevious }) => {
    const navigate = useNavigate();

    if (!post) return null;

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return `${import.meta.env.VITE_BACKEND_URL}/${imageUrl}`;
    };

    const imageUrl = post.imageUrl ? getImageUrl(post.imageUrl) : null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleViewFullPost = () => {
        navigate(`/post/${post._id}`);
        onClose();
    };

    return (
        <div className="post-grid-modal-backdrop" onClick={handleBackdropClick}>
            <div className="post-grid-modal">
                {/* Close button */}
                <button className="post-grid-modal-close" onClick={onClose}>
                    ✕
                </button>

                {/* Previous button */}
                {currentIndex > 0 && (
                    <button className="post-grid-modal-nav post-grid-modal-prev" onClick={onPrevious}>
                        ‹
                    </button>
                )}

                {/* Next button */}
                {currentIndex < posts.length - 1 && (
                    <button className="post-grid-modal-nav post-grid-modal-next" onClick={onNext}>
                        ›
                    </button>
                )}

                {/* Post content */}
                <div className="post-grid-modal-content">
                    {imageUrl ? (
                        <div className="post-grid-modal-image-container">
                            <img src={imageUrl} alt={post.title} />
                        </div>
                    ) : (
                        <div className="post-grid-modal-text-content">
                            <h2>{post.title}</h2>
                            {post.content && <p>{post.content}</p>}
                        </div>
                    )}

                    {/* Post info */}
                    <div className="post-grid-modal-info">
                        <h3>{post.title}</h3>
                        <div className="post-grid-modal-meta">
                            <span>{post.likes?.length || 0} likes</span>
                            <span>•</span>
                            <span>{post.comments?.length || 0} comments</span>
                        </div>
                        <button className="post-grid-modal-view-btn" onClick={handleViewFullPost}>
                            View Full Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostGridModal;

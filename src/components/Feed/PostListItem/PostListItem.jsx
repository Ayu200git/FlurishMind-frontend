import React, { useState } from 'react';
import Button from '../../Button/Button';
import Comments from '../../Comments/Comments';
import Image from '../../Image/Image';
import './PostListItem.css';

const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http')
    ? path
    : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const PostListItem = ({ 
  post, 
  onLike, 
  token,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLoadMoreComments,
  onLoadMoreReplies,
  onAddReply,
  onEditReply,
  onDeleteReply
}) => {
  const [showComments, setShowComments] = useState(false);

  const isLiked =
    currentUserId &&
    post.likes &&
    post.likes.some(
      (like) => like._id?.toString() === currentUserId?.toString()
    );

  const likesCount = post.likesCount || 0;
  const commentsCount = post.commentsCount || 0;

  return (
    <div className="post-list-wrap" style={{marginBottom: '0.5rem'}}>
      <div className="post-list-item">
        <div className="post-list-item__user">
          {post.creator?.avatar ? (
            <img 
              src={getImageUrl(post.creator.avatar)} 
              alt={post.creator.name} 
              className="post-list-item__avatar" 
            />
          ) : (
            <div className="post-list-item__placeholder">
              {post.creator?.name?.[0]}
            </div>
          )}
          <span>{post.creator?.name}</span>
        </div>
        
        <span className="post-list-item__title">{post.title}</span>
        
        <div className="post-list-item__actions">
           {/* Like & Comment Buttons */}
           <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
              {onLike && (
                <button
                  className={isLiked ? "post__like-btn liked" : "post__like-btn"}
                  onClick={() => onLike(post._id)}
                  title={isLiked ? "Unlike" : "Like"}
                  style={{padding: '0.25rem'}}
                >
                  {isLiked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20" color="#ed4956">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  )}
                  <span style={{fontSize: '0.9rem'}}>{likesCount || 0}</span>
                </button>
              )}

              <button
                className="post__like-btn"
                onClick={() => setShowComments(!showComments)}
                title="Comments"
                style={{padding: '0.25rem'}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="20" height="20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <span style={{fontSize: '0.9rem'}}>{commentsCount || 0}</span>
              </button>
           </div>

           <Button mode="flat" link={`/post/${post._id}`}>View</Button>
        </div>
      </div>
      
      {/* Expanded Comments Section */}
      {showComments && (
        <div style={{ 
          border: '1px solid var(--border-color)', 
          borderTop: 'none', 
          borderRadius: '0 0 5px 5px', 
          padding: '1rem', 
          marginTop: '-0.5rem',
          background: 'var(--bg-primary)'
        }}>
          <Comments
            comments={post.comments || []}
            commentsCount={commentsCount}
            postId={post._id}
            currentUserId={currentUserId}
            token={token}
            onAddComment={onAddComment}
            onEditComment={onEditComment}
            onDeleteComment={onDeleteComment}
            onLoadMoreComments={onLoadMoreComments}
            onLoadMoreReplies={onLoadMoreReplies}
            onAddReply={onAddReply}
            onEditReply={onEditReply}
            onDeleteReply={onDeleteReply}
            show={true}
          />
        </div>
      )}
    </div>
  );
};

export default PostListItem;

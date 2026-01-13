import React, { useState } from 'react';
import Button from '../../Button/Button';
import Image from '../../Image/Image';
import Comments from '../../Comments/Comments';
import './Post.css';

/* ✅ helper to safely resolve image urls */
const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http')
    ? path
    : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const Post = ({
  author,
  authorImage,
  date,
  title,
  id,
  image,
  content,
  onStartEdit,
  onDelete,
  currentUserId,
  creatorId,
  likes = [],
  likesCount = 0,
  comments = [],
  commentsCount = 0,
  onLike,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLoadMoreComments,
  onLoadMoreReplies,
  onAddReply,
  onEditReply,
  onDeleteReply,
  onLikeComment,
  token
}) => {
  const isCreator =
    currentUserId && creatorId && currentUserId === creatorId;

  const [showComments, setShowComments] = useState(false);

  const isLiked =
    currentUserId &&
    likes &&
    likes.some(
      (like) => like._id?.toString() === currentUserId?.toString()
    );

  /* ✅ FIXED image url */
  const imageUrl = image ? getImageUrl(image) : null;
  const authorAvatar = authorImage ? getImageUrl(authorImage) : null;

  return (
    <article className="post">
      <header className="post__header">
        <div className="post__user">
          {authorAvatar ? (
            <img
              src={authorAvatar}
              alt={author}
              className="post__user-image"
            />
          ) : (
            <div className="post__user-placeholder">
              {author?.[0]}
            </div>
          )}

          <div className="post__user-info">
            <span className="post__author">{author}</span>
            <span className="post__date">{date}</span>
          </div>
        </div>

        <h1 className="post__title">{title}</h1>
      </header>

      {imageUrl && imageUrl !== 'https://via.placeholder.com/150' && (
        <div className="post__image">
          <Image imageUrl={imageUrl} contain />
        </div>
      )}

      <div className="post__actions-bar">
        {onLike && (
          <div className="post__actions-icons">
            <button
              className={isLiked ? "post__action-btn liked" : "post__action-btn"}
              onClick={onLike}
              title={isLiked ? "Unlike" : "Like"}
            >
              {isLiked ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" color="#ed4956">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )}
            </button>

            <button
              className="post__action-btn"
              onClick={() => setShowComments(!showComments)}
              title="Comments"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>
          </div>
        )}

      </div>

      <div className="post__likes-container">
        <span className="post__likes-count">
          {likesCount > 0 ? `${likesCount} likes` : '0 likes'}
        </span>
      </div>

      <div className="post__caption-section">
        {content && (
          <div className="post__caption">
            <span className="post__caption-author">{author}</span>
            <span className="post__caption-text">{content}</span>
          </div>
        )}
        {commentsCount > 0 && !showComments && (
          <Button mode="flat" className="post__view-comments" onClick={() => setShowComments(true)}>
            View all {commentsCount} comments
          </Button>
        )}
      </div>

      {token && (
        <Comments
          comments={comments}
          commentsCount={commentsCount}
          postId={id}
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
          onLikeComment={onLikeComment}
          show={showComments}
        />
      )}
    </article>
  );
};

export default Post;

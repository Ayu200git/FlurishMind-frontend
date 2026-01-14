import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../Button/Button';
import Image from '../../Image/Image';
import Comments from '../../Comments/Comments';
import './Post.css';

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
  onSave,
  isSaved,
  token
}) => {
  const navigate = useNavigate();
  const isCreator =
    currentUserId && creatorId && currentUserId === creatorId;

  const [showComments, setShowComments] = useState(false);

  const isLiked =
    currentUserId &&
    likes &&
    likes.some(
      (like) => like._id?.toString() === currentUserId?.toString()
    );

  const imageUrl = image ? getImageUrl(image) : null;
  const authorAvatar = authorImage ? getImageUrl(authorImage) : null;

  return (
    <article className="post">
      <header className="post__header">
        <div
          className="post__user"
          onClick={() => creatorId && navigate(`/profile/${creatorId}`)}
          style={{ cursor: creatorId ? 'pointer' : 'default' }}
        >
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

      </header>

      {imageUrl && (
        <div className="post__image">
          <Image imageUrl={imageUrl} contain />
        </div>
      )}

      <div className="post__content-section">
        {title && <h2 className="post__display-title">{title}</h2>}
        {content && <p className="post__display-content">{content}</p>}
      </div>

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
              onClick={() => {
                if (!showComments && comments.length === 0 && commentsCount > 0) {
                  onLoadMoreComments(id, 1);
                }
                setShowComments(!showComments);
              }}
              title="Comments"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>

            <button
              className="post__action-btn"
              onClick={onSave}
              title={isSaved ? "Unsave" : "Save"}
            >
              {isSaved ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" color="#ed4956">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z" />
                </svg>
              )}
            </button>
          </div>
        )}
        <Button mode="flat" link={`/post/${id}`} className="post__view-post-btn">
          View Post
        </Button>
      </div>

      <div className="post__likes-container">
        <span className="post__likes-count">
          {likesCount > 0 ? `${likesCount} likes` : '0 likes'}
        </span>
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

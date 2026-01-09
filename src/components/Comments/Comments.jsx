import React, { useState, Fragment } from 'react';
import Button from '../Button/Button';
import Input from '../Form/Input/Input';
import './Comments.css';

const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http')
    ? path
    : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const CommentItem = ({
  comment,
  currentUserId,
  onLikeComment,
  onAddReply,
  onLoadMoreReplies,
  onEditReply,
  onDeleteReply,
  onEdit,     // Generic handler for this item (could be comment or reply)
  onDelete,   // Generic handler
  token
}) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [repliesExpanded, setRepliesExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const isAuthor = currentUserId && comment.creator && comment.creator._id === currentUserId;

  const handleEditSubmit = () => {
    if (editedContent.trim() && onEdit) {
      onEdit(comment._id, editedContent);
    }
  };

  // Check if liker list contains current user. 
  // Likes is array of objects { _id, name } populated from backend.
  const isLiked = currentUserId && comment.likes && comment.likes.some(u => u._id?.toString() === currentUserId.toString());
  const likesCount = comment.likesCount || (comment.likes ? comment.likes.length : 0);

  const creator = comment.creator || { name: 'Unknown', avatar: null };
  const initials = creator.name ? creator.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyContent.trim()) {
      onAddReply(comment._id, replyContent);
      setReplyContent('');
      setShowReplyInput(false);
      setRepliesExpanded(true); // Auto expand to show new reply
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  // If we had totalReplies count from backend, we could show "View X more replies"
  // For now, assuming if replies exists, we show them.

  // For now, assuming if replies exists, we show them.

  return (
    <div className="comment-item">
      <div className="comment">
        <div className="comment__avatar">
          {creator.avatar ? (
            <img src={getImageUrl(creator.avatar)} alt={creator.name} />
          ) : (
            <div className="comment__avatar-placeholder">{initials}</div>
          )}
        </div>

        <div className="comment__content">
          <div className="comment__bubbles">
            <span className="comment__author">{creator.name}</span>
            {isEditing ? (
              <div className="comment__edit-layout">
                <Input
                  id={`edit-${comment._id}`}
                  type="text"
                  control="input"
                  value={editedContent}
                  onChange={(_, Val) => setEditedContent(Val)}
                />
                <div className="comment__edit-actions">
                  <button className="comment__action-btn" onClick={() => {
                    handleEditSubmit();
                    setIsEditing(false);
                  }}>Save</button>
                  <button className="comment__action-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <span className="comment__text">{comment.content}</span>
            )}
          </div>

          <div className="comment__actions">
            {!isEditing && (
              <>
                <button
                  className={isLiked ? "comment__action-btn liked" : "comment__action-btn"}
                  onClick={() => onLikeComment && onLikeComment(comment._id, isLiked)}
                >
                  {isLiked ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                      {likesCount || 'Like'}
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Like {likesCount > 0 && `(${likesCount})`}</span>
                  )}
                </button>
                <button
                  className="comment__action-btn"
                  onClick={() => setShowReplyInput(!showReplyInput)}
                >
                  Reply
                </button>
                {/* Author Actions */}
                {isAuthor && (
                  <>
                    <button className="comment__action-btn" onClick={() => {
                      setIsEditing(true);
                      setEditedContent(comment.content);
                    }}>Edit</button>
                    <button className="comment__action-btn" onClick={() => {
                      // Check if it's a top level or reply to decide which handler ?? 
                      // Actually Comments parent passes onEditReply/onDeleteReply for REPLIES.
                      // But for top level it passes onEditComment/onDeleteComment.
                      // BUT CommentItem receives specific props. 
                      // Wait, CommentItem is recursive. 
                      // We need to clarify props flow.
                      // Let's assume onUpdate / onDelete generic props specific to the level passed from parent.
                      onDelete(comment._id);
                    }}>Delete</button>
                  </>
                )}
              </>
            )}

            {comment.repliesCount > 0 && (
              <button
                className="comment__action-btn view-replies"
                onClick={() => {
                  setRepliesExpanded(!repliesExpanded);
                  if (!repliesExpanded && (!comment.replies || comment.replies.length < comment.repliesCount)) {
                    onLoadMoreReplies(comment._id, 1);
                  }
                }}
              >
                {repliesExpanded ? 'Hide replies' : `View ${comment.repliesCount || ''} replies`}
              </button>
            )}
          </div>
        </div>
      </div >

      {showReplyInput && (
        <form className="reply-form" onSubmit={handleReplySubmit}>
          <Input
            id={`reply-${comment._id}`}
            type="text"
            placeholder={`Reply to ${creator.name}...`}
            control="input"
            value={replyContent}
            onChange={(_, value) => setReplyContent(value)}
          />
          <Button mode="flat" type="submit" disabled={!replyContent.trim()}>
            Send
          </Button>
        </form>
      )}

      {
        repliesExpanded && hasReplies && (
          <div className="comment__replies">
            {comment.replies.map(reply => (
              <CommentItem
                key={reply._id}
                comment={reply}
                currentUserId={currentUserId}
                onLikeComment={onLikeComment}
                onAddReply={onAddReply}
                onLoadMoreReplies={onLoadMoreReplies}
                // Nested items are always replies
                onEdit={onEditReply}
                onDelete={onDeleteReply}
                onEditReply={onEditReply}
                onDeleteReply={onDeleteReply}
                token={token}
              />
            ))}
            {comment.replies && comment.repliesCount && comment.replies.length < comment.repliesCount && (
              <button
                className="load-more-replies"
                onClick={() => onLoadMoreReplies(comment._id, Math.ceil(comment.replies.length / 5) + 1)}
              >
                Load more replies
              </button>
            )}
          </div>
        )}
    </div>
  );
};

const Comments = ({
  comments,
  commentsCount,
  postId,
  currentUserId,
  token,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLoadMoreComments,
  onLoadMoreReplies,
  onAddReply,
  onEditReply,
  onDeleteReply,
  onLikeComment,
  show
}) => {
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const handleAddCommentHandler = (event) => {
    event.preventDefault();
    if (newComment.trim()) {
      onAddComment(postId, newComment);
      setNewComment('');
    }
  };

  const loadMoreComments = async () => {
    setIsLoadingComments(true);
    const nextPage = Math.ceil(comments.length / 5) + 1;
    await onLoadMoreComments(postId, nextPage);
    setIsLoadingComments(false);
  };

  if (!show) return null;

  return (
    <div className="comments">
      <div className="comments__content">
        { /* Load Previous / More Comments Logic (Instagram styles puts load more at top usually, but simple list is fine) */}
        <div className="comments__list">
          {comments.map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUserId={currentUserId}
              onLikeComment={onLikeComment}
              onAddReply={onAddReply}
              onLoadMoreReplies={onLoadMoreReplies}
              onEditReply={onEditReply}
              onDeleteReply={onDeleteReply}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              token={token}
            />
          ))}
        </div>

        {/* Load More Comments (Bottom) */}
        {comments.length < commentsCount && (
          <button
            className="comments__load-more"
            onClick={loadMoreComments}
            disabled={isLoadingComments}
            style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}
          >
            {isLoadingComments ? 'Loading...' : `View more comments`}
          </button>
        )}

        {token && (
          <form className="comments__form" onSubmit={handleAddCommentHandler}>
            <div style={{ flex: 1 }}>
              <Input
                id="new-comment"
                placeholder="Add a comment..."
                control="input"
                value={newComment}
                onChange={(_, value) => setNewComment(value)}
              />
            </div>
            <Button mode="flat" type="submit" disabled={!newComment.trim()}>
              Post
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Comments;

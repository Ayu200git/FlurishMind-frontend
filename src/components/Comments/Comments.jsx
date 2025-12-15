 import React, { useState } from 'react';
import Button from '../Button/Button';
import Input from '../Form/Input/Input';
import './Comments.css';

const COMMENTS_PER_PAGE = 5;
const REPLIES_PER_PAGE = 5;

/* ✅ helper to resolve image URLs */
const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http')
    ? path
    : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const Comments = ({
  comments = [],
  postId,
  currentUserId,
  token,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onLoadMoreComments = async () => ({ comments: [], hasMore: false }),
  onLoadMoreReplies = async () => ({ replies: [], hasMore: false }),
  onAddReply = async () => null,
  onEditReply = async () => null,
  onDeleteReply = async () => null,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editContent, setEditContent] = useState('');

  const [localComments, setLocalComments] = useState(
    comments.map(c => ({
      ...c,
      replies: c.replies || [],
      repliesPage: 1,
      hasMoreReplies: true,
      isLoadingReplies: false
    }))
  );

  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [replyInputMap, setReplyInputMap] = useState({});
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [editingReplyParentId, setEditingReplyParentId] = useState(null);

  /* ---------------- COMMENT ACTIONS (UNCHANGED) ---------------- */

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const addedComment = await onAddComment(postId, newComment.trim());
    if (addedComment) {
      setLocalComments(prev => [
        {
          ...addedComment,
          replies: [],
          repliesPage: 1,
          hasMoreReplies: false,
          isLoadingReplies: false
        },
        ...prev
      ]);
    }
    setNewComment('');
  };

  const handleEditComment = async (commentId, currentContent) => {
    if (editingCommentId === commentId) {
      if (editContent.trim() && editContent !== currentContent) {
        const updatedComment = await onEditComment(commentId, editContent.trim());
        if (updatedComment) {
          setLocalComments(prev =>
            prev.map(c =>
              c._id === commentId
                ? { ...updatedComment, replies: c.replies }
                : c
            )
          );
        }
      }
      setEditingCommentId(null);
      setEditContent('');
    } else {
      setEditingCommentId(commentId);
      setEditContent(currentContent);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      const deleted = await onDeleteComment(commentId);
      if (deleted) {
        setLocalComments(prev => prev.filter(c => c._id !== commentId));
      }
    }
  };

  /* ---------------- RENDER ---------------- */

  return (
    <div className="comments">
      <div className="comments__header">
        <button
          className="comments__toggle"
          onClick={() => setShowComments(!showComments)}
        >
          {showComments ? '▼' : '▶'} {showComments ? 'Hide' : 'Show'} Comments ({localComments.length})
        </button>
      </div>

      {showComments && (
        <div className="comments__content">
          {token && (
            <form className="comments__form" onSubmit={handleAddComment}>
              <Input
                id="new-comment"
                placeholder="Write a comment..."
                control="input"
                value={newComment}
                onChange={(id, value) => setNewComment(value)}
              />
              <Button mode="flat" type="submit" disabled={!newComment.trim()}>
                Post Comment
              </Button>
            </form>
          )}

          <div className="comments__list">
            {localComments.map(comment => {
              const creator = comment.creator || { name: 'Unknown', avatar: null };
              const initials = creator.name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();

              return (
                <div key={comment._id} className="comment">
                  <div className="comment__avatar">
                    {creator.avatar ? (
                      <img
                        src={getImageUrl(creator.avatar)}
                        alt={creator.name}
                      />
                    ) : (
                      <div className="comment__avatar-placeholder">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="comment__content">
                    <span className="comment__author">{creator.name}</span>
                    <span className="comment__text">{comment.content}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;

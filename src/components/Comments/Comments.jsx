import React, { useState } from 'react';
import Button from '../Button/Button';
import Input from '../Form/Input/Input';
import './Comments.css';

const COMMENTS_PER_PAGE = 5;
const REPLIES_PER_PAGE = 5;

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
  
  const [localComments, setLocalComments] = useState(comments.map(c => ({ 
    ...c, 
    replies: c.replies || [], 
    repliesPage: 1,
    hasMoreReplies: true,
    isLoadingReplies: false 
  })));
  const [commentsPage, setCommentsPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  const [replyInputMap, setReplyInputMap] = useState({});
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editingReplyContent, setEditingReplyContent] = useState('');
  const [editingReplyParentId, setEditingReplyParentId] = useState(null);

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
                ? { ...updatedComment, replies: c.replies || [], repliesPage: c.repliesPage, hasMoreReplies: c.hasMoreReplies, isLoadingReplies: c.isLoadingReplies } 
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

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      const deleted = await onDeleteComment(commentId);
      if (deleted) {
        setLocalComments(prev => prev.filter(c => c._id !== commentId));
      }
    }
  };
 
  const handleLoadMoreComments = async () => {
    setIsLoadingComments(true);
    const nextPage = commentsPage + 1;
    const result = await onLoadMoreComments(postId, nextPage);
    
    if (result && result.comments && result.comments.length > 0) {
      const newComments = result.comments.map(c => ({ 
        ...c, 
        replies: c.replies || [], 
        repliesPage: 1,
        hasMoreReplies: true,
        isLoadingReplies: false 
      }));
      setLocalComments(prev => [...prev, ...newComments]);
      setCommentsPage(nextPage);
      setHasMoreComments(result.hasMore ?? true);
    } else {
      setHasMoreComments(false);
    }
    setIsLoadingComments(false);
  };

  const handleLoadMoreReplies = async (commentId) => {
    setLocalComments(prev =>
      prev.map(c => 
        c._id === commentId 
          ? { ...c, isLoadingReplies: true }
          : c
      )
    );

    const comment = localComments.find(c => c._id === commentId);
    const nextPage = (comment?.repliesPage || 1) + 1;
    const result = await onLoadMoreReplies(commentId, nextPage);

    if (result && result.replies && result.replies.length > 0) {
      setLocalComments(prev =>
        prev.map(c =>
          c._id === commentId
            ? {
                ...c,
                replies: [...(c.replies || []), ...result.replies],
                repliesPage: nextPage,
                hasMoreReplies: result.hasMore ?? true,
                isLoadingReplies: false
              }
            : c
        )
      );
    } else {
      setLocalComments(prev =>
        prev.map(c =>
          c._id === commentId
            ? { ...c, hasMoreReplies: false, isLoadingReplies: false }
            : c
        )
      );
    }
  };

  const handleAddReply = async (commentId) => {
    const text = replyInputMap[commentId];
    if (!text || !text.trim()) return;

    const newReply = await onAddReply(commentId, text.trim());
    if (newReply) {
      setLocalComments(prev =>
        prev.map(c =>
          c._id === commentId
            ? { ...c, replies: [...(c.replies || []), newReply] }
            : c
        )
      );

      setReplyInputMap(prev => {
        const copy = { ...prev };
        delete copy[commentId];
        return copy;
      });
    }
  };

  const handleEditReply = async (replyId, currentContent, parentCommentId) => {
    if (editingReplyId === replyId) {
      if (editingReplyContent.trim() && editingReplyContent !== currentContent) {
        const updatedReply = await onEditReply(replyId, editingReplyContent.trim());
        if (updatedReply) {
          setLocalComments(prev =>
            prev.map(c =>
              c._id === parentCommentId
                ? {
                    ...c,
                    replies: c.replies.map(r => r._id === replyId ? updatedReply : r)
                  }
                : c
            )
          );
        }
      }
      setEditingReplyId(null);
      setEditingReplyContent('');
      setEditingReplyParentId(null);
    } else {
      setEditingReplyId(replyId);
      setEditingReplyContent(currentContent);
      setEditingReplyParentId(parentCommentId);
    }
  };

  const handleCancelReplyEdit = () => {
    setEditingReplyId(null);
    setEditingReplyContent('');
    setEditingReplyParentId(null);
  };
  
  const handleDeleteReply = async (replyId, parentCommentId) => {
    if (window.confirm('Are you sure you want to delete this reply?')) {
      const deleted = await onDeleteReply(replyId);
      if (deleted) {
        setLocalComments(prev =>
          prev.map(c =>
            c._id === parentCommentId
              ? { ...c, replies: c.replies.filter(r => r._id !== replyId) }
              : c
          )
        );
      }
    }
  };

  return (
    <div className="comments">
      <div className="comments__header">
        <button className="comments__toggle" onClick={() => setShowComments(!showComments)}>
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
            {localComments.length === 0 && <p className="comments__empty">No comments yet. Be the first to comment!</p>}

            {localComments.map(comment => {
              const creator = comment.creator || { name: 'Unknown', avatar: null };
              const isCommentAuthor = currentUserId && creator._id === currentUserId;
              const isEditing = editingCommentId === comment._id;
              const initials = (creator.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();
              const hasReplies = comment.replies && comment.replies.length > 0;

              return (
                <div key={comment._id} className="comment">
                  <div className="comment__wrapper">
                    <div className="comment__avatar">
                      {creator.avatar ? (
                        <img
                          src={creator.avatar.startsWith('http') ? creator.avatar : `http://localhost:8080/${creator.avatar}`}
                          alt={creator.name}
                        />
                      ) : (
                        <div className="comment__avatar-placeholder">{initials}</div>
                      )}
                    </div>

                    <div className="comment__content-wrapper">
                      {isEditing ? (
                        <div className="comment__edit">
                          <Input
                            id={`edit-comment-${comment._id}`}
                            control="input"
                            value={editContent}
                            onChange={(id, value) => setEditContent(value)}
                          />
                          <div className="comment__edit-actions">
                            <Button 
                              mode="flat" 
                              onClick={() => handleEditComment(comment._id, comment.content)} 
                              disabled={!editContent.trim()}
                            >
                              Save
                            </Button>
                            <Button mode="flat" design="danger" onClick={handleCancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="comment__text">
                            <span className="comment__author">{creator.name}</span>
                            <span className="comment__text-content">{comment.content}</span>
                          </div>
                          <div className="comment__meta">
                            <span className="comment__date">
                              {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            {isCommentAuthor && (
                              <div className="comment__actions">
                                <button 
                                  className="comment__action-btn" 
                                  onClick={() => handleEditComment(comment._id, comment.content)}
                                >
                                  Edit
                                </button>
                                <button 
                                  className="comment__action-btn comment__action-btn--delete" 
                                  onClick={() => handleDeleteComment(comment._id)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {token && !isEditing && (
                        <button 
                          className="comment__reply-btn" 
                          onClick={() => setReplyInputMap(prev => ({ ...prev, [comment._id]: prev[comment._id] || '' }))}
                        >
                          Reply
                        </button>
                      )}

                      {replyInputMap[comment._id] !== undefined && (
                        <div className="comment__reply-input">
                          <Input
                            id={`reply-${comment._id}`}
                            control="input"
                            placeholder="Write a reply..."
                            value={replyInputMap[comment._id]}
                            onChange={(id, value) => setReplyInputMap(prev => ({ ...prev, [comment._id]: value }))}
                          />
                          <div className="comment__reply-actions">
                            <Button 
                              mode="flat" 
                              onClick={() => handleAddReply(comment._id)} 
                              disabled={!replyInputMap[comment._id]?.trim()}
                            >
                              Post Reply
                            </Button>
                            <button 
                              className="comment__cancel-reply-btn"
                              onClick={() => setReplyInputMap(prev => {
                                const copy = { ...prev };
                                delete copy[comment._id];
                                return copy;
                              })}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {hasReplies && (
                        <div className="comment__replies">
                          <div className="replies__container">
                            {comment.replies.map(reply => {
                              const replyCreator = reply.creator || { name: 'Unknown', avatar: null };
                              const isReplyAuthor = currentUserId && replyCreator._id === currentUserId;
                              const isEditingReply = editingReplyId === reply._id;
                              const replyInitials = (replyCreator.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase();

                              return (
                                <div key={reply._id} className="reply">
                                  <div className="reply__wrapper">
                                    <div className="reply__avatar">
                                      {replyCreator.avatar ? (
                                        <img
                                          src={replyCreator.avatar.startsWith('http') ? replyCreator.avatar : `http://localhost:8080/${replyCreator.avatar}`}
                                          alt={replyCreator.name}
                                        />
                                      ) : (
                                        <div className="reply__avatar-placeholder">{replyInitials}</div>
                                      )}
                                    </div>
                                    <div className="reply__content-wrapper">
                                      {isEditingReply ? (
                                        <div className="reply__edit">
                                          <Input
                                            id={`edit-reply-${reply._id}`}
                                            control="input"
                                            value={editingReplyContent}
                                            onChange={(id, value) => setEditingReplyContent(value)}
                                          />
                                          <div className="reply__edit-actions">
                                            <Button 
                                              mode="flat" 
                                              onClick={() => handleEditReply(reply._id, reply.content, comment._id)} 
                                              disabled={!editingReplyContent.trim()}
                                            >
                                              Save
                                            </Button>
                                            <Button mode="flat" design="danger" onClick={handleCancelReplyEdit}>
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="reply__text">
                                            <span className="reply__author">{replyCreator.name}</span>
                                            <span className="reply__text-content">{reply.content}</span>
                                          </div>
                                          <div className="reply__meta">
                                            <span className="reply__date">
                                              {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                              })}
                                            </span>
                                            {isReplyAuthor && (
                                              <div className="reply__actions">
                                                <button 
                                                  className="reply__action-btn" 
                                                  onClick={() => handleEditReply(reply._id, reply.content, comment._id)}
                                                >
                                                  Edit
                                                </button>
                                                <button 
                                                  className="reply__action-btn reply__action-btn--delete" 
                                                  onClick={() => handleDeleteReply(reply._id, comment._id)}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {comment.hasMoreReplies && (
                            <button 
                              className="comment__load-more-replies"
                              onClick={() => handleLoadMoreReplies(comment._id)}
                              disabled={comment.isLoadingReplies}
                            >
                              {comment.isLoadingReplies ? 'Loading...' : 'Load more replies'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMoreComments && (
              <div className="comments__load-more-wrapper">
                <button 
                  className="comments__load-more" 
                  onClick={handleLoadMoreComments}
                  disabled={isLoadingComments}
                >
                  {isLoadingComments ? 'Loading comments...' : 'Load more comments (5)'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Comments;

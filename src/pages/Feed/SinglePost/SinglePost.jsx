import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Image from '../../../components/Image/Image';
import Loader from '../../../components/Loader/Loader';
import ErrorHandler from '../../../components/ErrorHandler/ErrorHandler';
import Comments from '../../../components/Comments/Comments';
import Button from '../../../components/Button/Button';
import FeedEdit from '../../../components/Feed/FeedEdit/FeedEdit';
import './SinglePost.css';

/* ✅ Helper to replace localhost safely */
const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http')
    ? path
    : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const SinglePost = ({ token }) => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const authToken = token || localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      const graphqlQuery = {
        query: `
          query FetchPost($id: ID!) {
            post(id: $id) {
              _id
              title
              content
              imageUrl
              creator { _id name avatar }
              createdAt
              likes { _id }
              likesCount
              commentsCount
            }
          }
        `,
        variables: { id: postId }
      };

      try {
        const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + authToken
          },
          body: JSON.stringify(graphqlQuery)
        });

        const resData = await res.json();
        if (resData.errors) throw new Error(resData.errors[0].message);

        // Fetch first 5 comments
        const commentsQuery = {
          query: `query PaginatedComments($postId: ID!, $page: Int!, $limit: Int!) {
              paginatedComments(postId: $postId, page: $page, limit: $limit) {
                comments {
                  _id content creator { _id name email avatar } createdAt parentId
                  likes { _id } likesCount
                  repliesCount
                  replies {
                    _id content creator { _id name email avatar } createdAt parentId
                    likes { _id } likesCount
                  }
                }
                totalComments hasMore
              }
            }`,
          variables: { postId, page: 1, limit: 5 }
        };
        const commentsRes = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
          body: JSON.stringify(commentsQuery)
        });
        const commentsData = await commentsRes.json();

        const fetchedPost = resData.data.post;
        if (commentsData.data && commentsData.data.paginatedComments) {
          fetchedPost.comments = commentsData.data.paginatedComments.comments;
        } else {
          fetchedPost.comments = [];
        }

        setPost(fetchedPost);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, authToken]);

  /* ---------------- HANDLERS ---------------- */

  const startEditHandler = () => {
    setIsEditing(true);
  };

  const cancelEditHandler = () => {
    setIsEditing(false);
  };

  const finishEditHandler = async (postData) => {
    setEditLoading(true);
    const formData = new FormData();
    formData.append('title', postData.title);
    formData.append('content', postData.content);

    try {
      let imageUrl = post.imageUrl;
      if (postData.image) {
        formData.append('image', postData.image);
        if (post.imageUrl) {
          formData.append('oldPath', post.imageUrl);
        }
        const res = await fetch(import.meta.env.VITE_BACKEND_URL + '/post-image', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + authToken,
          },
          body: formData
        });
        const resData = await res.json();
        imageUrl = resData.filePath;
      }

      const graphqlQuery = {
        query: `
                mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
                    updatePost(id: $id, postInput: {title: $title, content: $content, imageUrl: $imageUrl}) {
                        _id title content imageUrl creator { _id name } likes { _id } likesCount
                        comments { _id content creator { _id name } createdAt } commentsCount createdAt
                    }
                }
            `,
        variables: {
          id: post._id,
          title: postData.title,
          content: postData.content,
          imageUrl: imageUrl
        }
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) {
        throw new Error('User not authenticated.');
      }

      setPost(resData.data.updatePost);
      setIsEditing(false);
      setEditLoading(false);
    } catch (err) {
      console.log(err);
      setIsEditing(false);
      setEditLoading(false);
      setError('Failed to edit post.');
    }
  };

  const deletePostHandler = async () => {
    setLoading(true);
    try {
      const graphqlQuery = {
        query: `mutation DeletePost($id: ID!) { deletePost(id: $id) }`,
        variables: { id: postId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);
      // Redirect to feed
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to delete post');
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!authToken) return setError('Please login to like posts');
    try {
      const isLiked = post.likes?.some(like => like._id === currentUserId);
      const graphqlQuery = {
        query: `mutation ${isLiked ? 'UnlikePost' : 'LikePost'}($postId: ID!) {
          ${isLiked ? 'unlikePost' : 'likePost'}(postId: $postId) { _id likes { _id } likesCount }
        }`,
        variables: { postId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const updatedData = resData.data[isLiked ? 'unlikePost' : 'likePost'];
      setPost(prev => ({
        ...prev,
        likes: updatedData.likes,
        likesCount: updatedData.likesCount
      }));
    } catch (err) {
      setError(err.message || 'Failed to like/unlike post');
    }
  };


  const handleAddComment = async (content) => {
    // Wrapper to match signature expected by Comments component if it passes just content, 
    // but Comments component passes (content) to onAddComment.
    // Wait, in Comments.jsx: onAddComment(newComment)
    // in Post.jsx: handleAddComment(postId, content) -> this was mismatch?
    // No, in SinglePost, we need to adapt.
    // Comments component calls `onAddComment(content)`.
    // So here:
    handleAddCommentLogic(post._id, content);
  };

  const handleAddCommentLogic = async (postId, content) => {
    try {
      const graphqlQuery = {
        query: `
          mutation AddComment($content: String!, $postId: ID!) {
            addComment(commentInput: { content: $content, postId: $postId }) {
              _id
              content
              creator { _id name avatar }
              createdAt
              parentId
              likes { _id }
              likesCount
              repliesCount
              replies { _id } 
            }
          }
        `,
        variables: { content, postId }
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const newComment = resData.data.addComment;
      setPost(prev => ({
        ...prev,
        comments: [newComment, ...(prev.comments || [])],
        commentsCount: (prev.commentsCount || 0) + 1
      }));
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      const graphqlQuery = {
        query: `
          mutation UpdateComment($commentId: ID!, $content: String!) {
            updateComment(commentId: $commentId, content: $content) {
              _id content creator { _id name avatar } createdAt likes { _id } likesCount
            }
          }
        `,
        variables: { commentId, content }
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      setPost(prev => ({
        ...prev,
        comments: prev.comments.map(c =>
          c._id === commentId ? { ...c, ...resData.data.updateComment } : c
        )
      }));
    } catch (err) {
      setError(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const graphqlQuery = {
        query: `mutation DeleteComment($commentId: ID!) { deleteComment(commentId: $commentId) }`,
        variables: { commentId }
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId),
        commentsCount: Math.max((prev.commentsCount || 1) - 1, 0)
      }));
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  // Handlers for nested comments (passed to Comments component)
  const handleLikeComment = async (commentId, isLiked) => {
    // Logic for liking comment
    try {
      const graphqlQuery = {
        query: `mutation ${isLiked ? 'UnlikeComment' : 'LikeComment'}($commentId: ID!) {
            ${isLiked ? 'unlikeComment' : 'likeComment'}(commentId: $commentId) { 
                _id 
                likes { _id name } 
                likesCount 
            }
          }`,
        variables: { commentId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      // Update local state is tricky with recursion, but Comments component might handle UI state 
      // if we just trigger re-fetch or if we update the post state deep?
      // Updating deep nested state is hard.
      // For now, simpler: user will see updated number because we update the specific comment in state?
      // Actually Comments component uses props. 
      // We need to update the `post` state with new comment data.
      // Or, since CommentItem has local state for optimistic? No, it relies on props.

      // We need a helper to find and update comment recursively
      const updateCommentInTree = (comments, updatedComment) => {
        return comments.map(c => {
          if (c._id === updatedComment._id) {
            return { ...c, ...updatedComment };
          }
          if (c.replies) {
            return { ...c, replies: updateCommentInTree(c.replies, updatedComment) };
          }
          return c;
        })
      };

      const updatedPartial = resData.data[isLiked ? 'unlikeComment' : 'likeComment'];
      setPost(prev => ({
        ...prev,
        comments: updateCommentInTree(prev.comments, updatedPartial)
      }));

    } catch (err) {
      console.log(err);
    }
  }

  const handleAddReply = async (commentId, content) => {
    try {
      const graphqlQuery = {
        query: `mutation AddReply($postId: ID!, $commentId: ID!, $content: String!) {
                  addReply(postId: $postId, commentId: $commentId, content: $content) {
                      _id content creator { _id name avatar } createdAt parentId likes { _id } likesCount
                  }
              }`,
        variables: { postId: post._id, commentId, content }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const newReply = resData.data.addReply;

      // Helper to add reply
      const addReplyToTree = (comments, targetId, reply) => {
        return comments.map(c => {
          if (c._id === targetId) {
            return {
              ...c,
              replies: [...(c.replies || []), reply],
              repliesCount: (c.repliesCount || 0) + 1
            };
          }
          if (c.replies) {
            return { ...c, replies: addReplyToTree(c.replies, targetId, reply) };
          }
          return c;
        })
      };

      setPost(prev => ({
        ...prev,
        comments: addReplyToTree(prev.comments, commentId, newReply)
      }));
    } catch (err) {
      console.log(err);
    }
  }

  const handleLoadMoreReplies = async (commentId, page) => {
    // Implement if needed for SinglePost, similar to Feed
    // For SinglePost, maybe we just fetch all? Or use same logic.
    // Leave empty or basic implementation for now.
  }

  const errorHandler = () => setError(null);

  /* ---------------- RENDER ---------------- */

  // Determine Creator status
  const isCreator = post && currentUserId && post.creator?._id === currentUserId;
  const isLikedPost = post && post.likes?.some(like => like._id === currentUserId);
  /* ✅ FIXED image url */
  const imageUrl = post?.imageUrl ? getImageUrl(post.imageUrl) : null;

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}><Loader /></div>;
  }

  if (!post) {
    return (
      <section className="single-post" style={{ textAlign: 'center', padding: '2rem' }}>
        <p>No post found.</p>
      </section>
    );
  }

  return (
    <>
      <ErrorHandler error={error} onHandle={errorHandler} />
      <FeedEdit
        editing={isEditing}
        selectedPost={post}
        onCancelEdit={cancelEditHandler}
        onFinishEdit={finishEditHandler}
        loading={editLoading}
      />
      <section className="single-post">

        <header className="single-post__header">
          <div>
            <h1>{post.title}</h1>
            <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
              Created by {post.creator?.name || 'Unknown'} on{' '}
              {new Date(post.createdAt).toLocaleDateString('en-US')}
            </h2>
          </div>
        </header>

        {imageUrl && imageUrl !== 'https://via.placeholder.com/150' && (
          <div className="single-post__image">
            <Image contain imageUrl={imageUrl} />
          </div>
        )}

        {/* Centered Content */}
        <div className="single-post__body">
          <p className="single-post__content">{post.content}</p>
        </div>

        {/* Footer with Actions */}
        <div className="single-post__footer">
          <div className="single-post__likes">
            {!isCreator && (
              <button
                onClick={handleLike}
                className={isLikedPost ? "post__like-btn liked" : "post__like-btn"}
                title={isLikedPost ? "Unlike" : "Like"}
              >
                {isLikedPost ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24" color="#ed4956">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="24" height="24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                )}
                <span>{post.likesCount || 0}</span>
              </button>
            )}
          </div>

          {isCreator && (
            <div className="single-post__creator-actions">
              <Button mode="flat" onClick={startEditHandler}>Edit</Button>
              <Button mode="flat" design="danger" onClick={deletePostHandler}>Delete</Button>
            </div>
          )}
        </div>

        <Comments
          comments={post.comments || []}
          commentsCount={post.commentsCount}
          postId={postId}
          currentUserId={currentUserId}
          token={authToken}
          onAddComment={handleAddComment}
          onEditComment={handleEditComment}
          onDeleteComment={handleDeleteComment}
          onLikeComment={handleLikeComment}
          onAddReply={handleAddReply}
          onLoadMoreReplies={handleLoadMoreReplies}
          show={true}
        />
      </section>
    </>
  );
};

export default SinglePost;

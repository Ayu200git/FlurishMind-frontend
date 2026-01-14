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

  const [showComments, setShowComments] = useState(false);

  const authToken = token || localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');

  const [isSaved, setIsSaved] = useState(false);

  // Check valid auth before actions
  useEffect(() => {
    if (!authToken || !postId) return;
    // Check if post is saved by user
    const checkSaved = async () => {
      try {
        const query = {
          query: `query { user { savedPosts { _id } } }`
        };
        const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + authToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(query)
        });
        const resData = await res.json();
        if (resData.data?.user?.savedPosts) {
          const isPostSaved = resData.data.user.savedPosts.some(p => p._id === postId);
          setIsSaved(isPostSaved);
        }
      } catch (err) {
        console.log("Error checking saved status", err);
      }
    };
    checkSaved();
  }, [authToken, postId]);

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

        const fetchedPost = resData.data.post;
        fetchedPost.comments = []; // Initialize empty
        setPost(fetchedPost);

        // Load initial 5 comments
        handleLoadMoreComments(postId, 1);

      } catch (err) {
        setError(err.message || 'Failed to fetch post');
      }
      setLoading(false);
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

  const handleSavePost = async () => {
    if (!authToken) return setError('Please login to save posts');
    try {
      const action = isSaved ? 'unsavePost' : 'savePost';
      const graphqlQuery = {
        query: `
          mutation {
            ${action}(postId: "${postId}") {
              _id
              savedPosts {
                _id
              }
            }
          }
        `
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

      setIsSaved(!isSaved);
    } catch (err) {
      setError(err.message || 'Failed to save/unsave post');
    }
  };


  const handleAddComment = async (postId, content) => {
    if (!authToken) return setError('Please login to comment');
    try {
      const graphqlQuery = {
        query: `mutation AddComment($content: String!, $postId: ID!) {
          addComment(commentInput: { content: $content, postId: $postId }) {
            _id content creator { _id name email avatar } createdAt parentId likes { _id } likesCount
            replies { _id } repliesCount
          }
        }`,
        variables: { content, postId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
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

  const handleLoadMoreComments = async (postId, page) => {
    if (!authToken) return { comments: [], hasMore: false };
    try {
      const graphqlQuery = {
        query: `query PaginatedComments($postId: ID!, $page: Int!, $limit: Int!) {
          paginatedComments(postId: $postId, page: $page, limit: $limit) {
            comments {
              _id content creator { _id name email avatar } createdAt parentId
              likes { _id } likesCount
              repliesCount
              replies {
                _id content creator { _id name email avatar } createdAt parentId
                likes { _id } likesCount
                repliesCount
                replies { _id }
              }
            }
            totalComments hasMore
          }
        }`,
        variables: { postId, page, limit: 5 }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const data = resData.data.paginatedComments;

      setPost(prevPost => {
        const oldComments = prevPost.comments || [];
        const newComments = data.comments.filter(nc => !oldComments.find(oc => oc._id === nc._id));
        return { ...prevPost, comments: [...oldComments, ...newComments] };
      });

      return data || { comments: [], hasMore: false };
    } catch (err) {
      setError(err.message || 'Failed to load more comments');
      return { comments: [], hasMore: false };
    }
  };

  const handleLoadMoreReplies = async (commentId, page) => {
    if (!authToken) return { replies: [], hasMore: false };
    try {
      const graphqlQuery = {
        query: `query PaginatedReplies($commentId: ID!, $page: Int!, $limit: Int!) {
          paginatedReplies(commentId: $commentId, page: $page, limit: $limit) {
            replies {
              _id content creator { _id name email avatar } createdAt
              repliesCount
              replies { _id }
            }
            totalReplies hasMore
          }
        }`,
        variables: { commentId, page, limit: 5 }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const newReplies = resData.data.paginatedReplies.replies;

      // Helper to recursively find and update comment
      const updateCommentRecursive = (comments) => {
        return comments.map(c => {
          if (c._id === commentId) {
            // Found target, append replies
            const oldReplies = c.replies || [];
            const uniqueNewReplies = newReplies.filter(nr => !oldReplies.find(or => or._id === nr._id));
            return { ...c, replies: [...oldReplies, ...uniqueNewReplies] };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateCommentRecursive(c.replies) };
          }
          return c;
        });
      };

      setPost(prevPost => {
        if (!prevPost.comments) return prevPost;
        return { ...prevPost, comments: updateCommentRecursive(prevPost.comments) };
      });

      return resData.data.paginatedReplies || { replies: [], hasMore: false };
    } catch (err) {
      setError(err.message || 'Failed to load more replies');
      return { replies: [], hasMore: false };
    }
  };



  // Helper for recursive updates
  const updateCommentsState = (comments, targetId, updateFn) => {
    return comments.map(c => {
      if (c._id === targetId) {
        return updateFn(c);
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: updateCommentsState(c.replies, targetId, updateFn) };
      }
      return c;
    });
  };

  const handleLikeComment = async (commentId, isLiked) => {
    if (!authToken) return setError('Please login to like comment');
    try {
      const mutation = isLiked ? 'unlikeComment' : 'likeComment';
      const graphqlQuery = {
        query: `mutation ${isLiked ? 'UnlikeComment' : 'LikeComment'}($commentId: ID!) {
          ${mutation}(commentId: $commentId) {
            _id likes { _id } likesCount
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

      const updatedData = resData.data[mutation];
      setPost(prev => ({
        ...prev,
        comments: updateCommentsState(prev.comments || [], commentId, (c) => ({ ...c, ...updatedData }))
      }));
    } catch (err) {
      setError(err.message || 'Failed to like comment');
    }
  };

  const handleAddReply = async (commentId, content) => {
    if (!authToken) return setError('Please login to reply');
    try {
      const graphqlQuery = {
        query: `mutation AddComment($content: String!, $postId: ID!, $parentId: ID!) {
          addComment(commentInput: { content: $content, postId: $postId, parentId: $parentId }) {
            _id content creator { _id name email avatar } createdAt parentId likes { _id } likesCount
            replies { _id } repliesCount
          }
        }`,
        variables: { content, postId: post._id, parentId: commentId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const newReply = resData.data.addComment;
      setPost(prev => ({
        ...prev,
        comments: updateCommentsState(prev.comments || [], commentId, (c) => ({
          ...c,
          replies: [newReply, ...(c.replies || [])],
          repliesCount: (c.repliesCount || 0) + 1
        }))
      }));
    } catch (err) {
      setError(err.message || 'Failed to add reply');
    }
  };


  /* Old non-recursive handlers replaced/merged */
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
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      setPost(prev => ({
        ...prev,
        comments: prev.comments.filter(c => c._id !== commentId),
        commentsCount: (prev.commentsCount || 1) - 1
      }));
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  const handleEditReply = async (replyId, content) => {
    try {
      const graphqlQuery = {
        query: `mutation UpdateComment($commentId: ID!, $content: String!) {
            updateComment(commentId: $commentId, content: $content) {
              _id content creator { _id name avatar } createdAt likes { _id } likesCount
            }
          }`,
        variables: { commentId: replyId, content }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const updated = resData.data.updateComment;
      setPost(prev => ({
        ...prev,
        comments: updateCommentsState(prev.comments || [], replyId, (c) => ({ ...c, ...updated }))
      }));
    } catch (err) {
      setError(err.message || 'Failed to edit reply');
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      const graphqlQuery = {
        query: `mutation DeleteComment($commentId: ID!) { deleteComment(commentId: $commentId) }`,
        variables: { commentId: replyId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      // Recursive remove
      const removeReplyRecursive = (comments) => {
        return comments.map(c => {
          if (c.replies && c.replies.some(r => r._id === replyId)) {
            return {
              ...c,
              replies: c.replies.filter(r => r._id !== replyId),
              repliesCount: (c.repliesCount || 1) - 1
            };
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: removeReplyRecursive(c.replies) };
          }
          return c;
        });
      };

      setPost(prev => ({
        ...prev,
        comments: removeReplyRecursive(prev.comments || [])
      }));
    } catch (err) {
      setError(err.message || 'Failed to delete reply');
    }
  };

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

        {/* Header: User Info */}
        <header className="single-post__header">
          <div className="single-post__user">
            <div className="single-post__user-avatar">
              {post.creator?.avatar ? (<img src={getImageUrl(post.creator.avatar)} alt={post.creator.name} />) : (<div className="single-post__user-placeholder">{post.creator?.name?.[0]}</div>)}
            </div>
            <div className="single-post__user-info">
              <span className="single-post__author">{post.creator?.name || 'Unknown'}</span>
              {/* Optional: Location or other meta could go here */}
            </div>
          </div>
          {isCreator && (
            <div className="single-post__creator-actions">
              <Button mode="flat" onClick={startEditHandler}>Edit</Button>
              <Button mode="flat" design="danger" onClick={deletePostHandler}>Delete</Button>
            </div>
          )}
        </header>

        {/* Image */}
        {imageUrl && (
          <div className="single-post__image">
            <Image contain imageUrl={imageUrl} />
          </div>
        )}

        {/* Body / Content - Moved above actions to match Feed */}
        <div className="single-post__body">
          <div className="single-post__caption">
            <span className="single-post__caption-author">{post.creator?.name || 'Unknown'}</span>
            <span className="single-post__content-text">{post.content}</span>
          </div>
          <div className="single-post__date">
            {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Action Bar */}
        <div className="single-post__actions-bar">
          <div className="single-post__actions-icons">
            {!isCreator && (
              <button
                onClick={handleLike}
                className={isLikedPost ? "post__action-btn liked" : "post__action-btn"}
                title={isLikedPost ? "Unlike" : "Like"}
              >
                {isLikedPost ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28" color="#ed4956">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="28" height="28">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                )}
              </button>
            )}
            {/* Dummy Comment Icon for visual consistency */}
            <button className="post__action-btn" onClick={() => setShowComments(!showComments)} title="Comments">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="28" height="28">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>

            <button
              className="post__action-btn"
              onClick={handleSavePost}
              title={isSaved ? "Unsave" : "Save"}
            >
              {isSaved ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path fillRule="evenodd" d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="28" height="28">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Likes Count */}
        <div className="single-post__likes-container">
          <span className="single-post__likes-count">{post.likesCount || 0} likes</span>
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
          onEditReply={handleEditReply}
          onDeleteReply={handleDeleteReply}
          onLoadMoreComments={handleLoadMoreComments}
          onLoadMoreReplies={handleLoadMoreReplies}
          show={showComments}
        />
      </section>
    </>
  );
};

export default SinglePost;

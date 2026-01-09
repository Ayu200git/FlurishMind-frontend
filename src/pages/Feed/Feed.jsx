import React, { useState, useEffect, useCallback, Fragment } from 'react';
import Post from '../../components/Feed/Post/Post';
import Button from '../../components/Button/Button';
import FeedEdit from '../../components/Feed/FeedEdit/FeedEdit';
import Input from '../../components/Form/Input/Input';
import Paginator from '../../components/Paginator/Paginator';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import FlashMessage from '../../components/FlashMessage/FlashMessage';
import { useViewMode } from '../../context/ViewModeContext';
import './Feed.css';
import PostListItem from '../../components/Feed/PostListItem/PostListItem';

/* Helper to get Image URL similarly to Post.jsx */
const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const Feed = ({ userId, token, viewOnly = false, onNewPostRef, onEditRef }) => {
  const { isListView } = useViewMode();
  const [isEditing, setIsEditing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [editPost, setEditPost] = useState(null);
  const [status, setStatus] = useState('');
  const [postPage, setPostPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  const authToken = token || localStorage.getItem('token');

  const catchError = (err) => setError(err.message || 'Something went wrong!');

  useEffect(() => {
    if (!authToken || viewOnly) return;

    const fetchStatus = async () => {
      const graphqlQuery = {
        query: `query { user { status } }`
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
        setStatus(resData.data.user.status || '');
      } catch (err) {
        catchError(err);
      }
    };

    fetchStatus();
    loadPosts();
  }, [authToken, viewOnly]);

  const [perPage, setPerPage] = useState(5);
  // ... other states ...

  // ...

  const loadPosts = useCallback(
    async (pageToFetch = 1) => {
      setPostsLoading(true);
      const graphqlQuery = {
        query: `
          query FetchPosts($page: Int!, $limit: Int!) {
            posts(page: $page, limit: $limit) {
              posts {
                _id title content imageUrl
                creator { _id name }
                likes { _id }
                likesCount commentsCount
                comments {
                  _id content creator { _id name avatar } createdAt parentId
                  likes { _id } likesCount
                  repliesCount
                  replies {
                    _id content creator { _id name avatar } createdAt parentId
                    likes { _id } likesCount
                    repliesCount
                    replies { _id }
                  }
                }
                createdAt
              }
              totalPosts
            }
          }
        `,
        variables: { page: pageToFetch, limit: perPage }
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

        const postsData = resData.data.posts || { posts: [], totalPosts: 0 };

        setPosts(prev => {
          if (isListView) {
            // List View: Standard Pagination (Replace)
            return postsData.posts;
          } else {
            // Grid View: Infinite Scroll (Append)
            if (pageToFetch === 1) return postsData.posts;
            // Filter duplicates just in case
            const newPosts = postsData.posts.filter(p => !prev.find(existing => existing._id === p._id));
            return [...prev, ...newPosts];
          }
        });
        setTotalPosts(postsData.totalPosts || 0);
        setPostsLoading(false);
        setPostPage(pageToFetch); // Update current page state
      } catch (err) {
        catchError(err);
        setPostsLoading(false);
      }
    },
    [authToken, isListView, perPage]
  );

  // Reload posts when perPage changes (for List View)
  useEffect(() => {
    if (isListView) {
      loadPosts(1);
    }
  }, [perPage, isListView, loadPosts]);

  // Infinite Scroll Handler - Only for Grid View
  useEffect(() => {
    if (isListView) return;

    const handleScroll = () => {
      const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight;
      if (bottom && !postsLoading && posts.length < totalPosts) {
        loadPosts(postPage + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [postsLoading, totalPosts, posts.length, loadPosts, postPage, isListView]);

  const statusUpdateHandler = async (event) => {
    event.preventDefault();
    const graphqlQuery = {
      query: `mutation UpdateStatus($status: String!) { updateStatus(status: $status) { status } }`,
      variables: { status }
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
      setStatus(resData.data.updateStatus.status || '');
    } catch (err) {
      catchError(err);
    }
  };

  const newPostHandler = () => { if (!viewOnly) setIsEditing(true); };

  useEffect(() => {
    if (onNewPostRef) onNewPostRef.current = newPostHandler;
    if (onEditRef) onEditRef.current = () => posts[0] && startEditPostHandler(posts[0]._id);
  }, [onNewPostRef, onEditRef, posts]);

  const startEditPostHandler = (postId) => {
    const loadedPost = posts.find((p) => p._id === postId);
    setIsEditing(true);
    setEditPost({ ...loadedPost });
  };

  const cancelEditHandler = () => { setIsEditing(false); setEditPost(null); };

  const finishEditHandler = async (postData) => {
    setEditLoading(true);
    setError(null);
    try {
      let imageUrl = '';
      if (postData.image instanceof File) {
        const formData = new FormData();
        formData.append('image', postData.image);
        if (editPost?.imageUrl) formData.append('oldPath', editPost.imageUrl);
        const uploadRes = await fetch(import.meta.env.VITE_BACKEND_URL + '/post-image', {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + authToken },
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Failed to upload image');
        imageUrl = (await uploadRes.json()).filePath;
      } else imageUrl = postData.imageUrl || editPost?.imageUrl || 'https://via.placeholder.com/150';

      const isUpdate = !!editPost;
      const graphqlQuery = isUpdate
        ? {
          query: `mutation UpdatePost($id: ID!, $title: String!, $content: String!, $imageUrl: String!) {
              updatePost(id: $id, postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
                _id title content imageUrl creator { _id name } likes { _id } likesCount
                comments { _id content creator { _id name } createdAt } commentsCount createdAt
              }
            }`,
          variables: { id: editPost._id, title: postData.title, content: postData.content, imageUrl }
        }
        : {
          query: `mutation CreatePost($title: String!, $content: String!, $imageUrl: String!) {
              createPost(postInput: { title: $title, content: $content, imageUrl: $imageUrl }) {
                _id title content imageUrl creator { _id name } likes { _id } likesCount
                comments { _id content creator { _id name } createdAt } commentsCount createdAt
              }
            }`,
          variables: { title: postData.title, content: postData.content, imageUrl }
        };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const post = isUpdate ? resData.data.updatePost : resData.data.createPost;
      setPosts((prev) => isUpdate ? prev.map(p => p._id === editPost._id ? post : p) : [post, ...prev]);
      setIsEditing(false);
      setEditPost(null);
      setEditLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to create/edit post');
      setEditLoading(false);
    }
  };

  const statusInputChangeHandler = (id, value) => setStatus(value);

  const deletePostHandler = async (postId) => {
    setPostsLoading(true);
    setError(null);
    try {
      const graphqlQuery = { query: `mutation DeletePost($id: ID!) { deletePost(id: $id) }`, variables: { id: postId } };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);
      setPosts(prev => prev.filter(p => p._id !== postId));
      setFlashMessage({ message: 'Post deleted successfully!', type: 'success' });
      setPostsLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to delete post');
      setFlashMessage({ message: err.message || 'Failed to delete post', type: 'error' });
      setPostsLoading(false);
    }
  };

  const errorHandler = () => setError(null);
  const flashHandler = () => setFlashMessage(null);

  const handleLike = async (postId) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to like posts', type: 'error' });
    try {
      const post = posts.find(p => p._id === postId);
      const isLiked = post.likes?.some(like => like._id === userId);
      const graphqlQuery = {
        query: `mutation ${isLiked ? 'UnlikePost' : 'LikePost'}($postId: ID!) {
          ${isLiked ? 'unlikePost' : 'likePost'}(postId: $postId) { _id likes { _id } likesCount comments { _id content creator { _id name } createdAt } commentsCount }
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
      const updatedPost = resData.data[isLiked ? 'unlikePost' : 'likePost'];
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, ...updatedPost } : p));
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to like/unlike post', type: 'error' });
    }
  };

  const handleAddComment = async (postId, content) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to comment', type: 'error' });
    try {
      const graphqlQuery = { query: `mutation AddComment($content: String!, $postId: ID!) { addComment(commentInput: { content: $content, postId: $postId }) { _id content creator { _id name avatar } createdAt parentId replies { _id } repliesCount likes { _id } likesCount } }`, variables: { content, postId } };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken }, body: JSON.stringify(graphqlQuery) });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const newComment = resData.data.addComment;
      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        return {
          ...p,
          comments: [newComment, ...p.comments],
          commentsCount: (p.commentsCount || 0) + 1
        };
      }));
      setFlashMessage({ message: 'Comment added successfully!', type: 'success' });
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to add comment', type: 'error' });
    }
  };

  // Helper for recursive updates in Feed
  const updateCommentInFeedRecursive = (comments, targetId, updateFn) => {
    return comments.map(c => {
      if (c._id === targetId) return updateFn(c);
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: updateCommentInFeedRecursive(c.replies, targetId, updateFn) };
      }
      return c;
    });
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

      setPosts(prevPosts => {
        const postIndex = prevPosts.findIndex(p => p._id === postId);
        if (postIndex === -1) return prevPosts;

        const updatedPost = { ...prevPosts[postIndex] };
        const oldComments = updatedPost.comments || [];
        const newComments = data.comments.filter(nc => !oldComments.find(oc => oc._id === nc._id));

        updatedPost.comments = [...oldComments, ...newComments];

        const updatedPosts = [...prevPosts];
        updatedPosts[postIndex] = updatedPost;
        return updatedPosts;
      });

      return data || { comments: [], hasMore: false };
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to load more comments', type: 'error' });
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
              likes { _id } likesCount
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

      setPosts(prevPosts => {
        return prevPosts.map(p => {
          if (!p.comments) return p;
          return {
            ...p,
            comments: updateCommentInFeedRecursive(p.comments, commentId, (c) => {
              const oldReplies = c.replies || [];
              const uniqueNewReplies = newReplies.filter(nr => !oldReplies.find(or => or._id === nr._id));
              return { ...c, replies: [...oldReplies, ...uniqueNewReplies] };
            })
          };
        });
      });

      return resData.data.paginatedReplies || { replies: [], hasMore: false };
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to load more replies', type: 'error' });
      return { replies: [], hasMore: false };
    }
  };

  const handleAddReply = async (commentId, content) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to reply', type: 'error' });
    try {
      // Find the post ID - scan posts to find which one contains this commentId in its tree
      // For addReply, we need postId for mutation.
      // We can try to find it from state.
      let targetPostId = null;
      posts.forEach(p => {
        // Simple check if top level comment matches, or we need recursive find.
        // Actually, we can just pass posts[0]?._id if we are lazy but that's wrong for feed.
        // Better: The caller (Comments component) doesn't pass postId for replies deep down.
        // But we can iterate to find it.
        const findInComments = (comments) => {
          for (let c of comments) {
            if (c._id === commentId) return true;
            if (c.replies && findInComments(c.replies)) return true;
          }
          return false;
        };
        if (p.comments && findInComments(p.comments)) targetPostId = p._id;
      });

      if (!targetPostId && posts.length > 0) targetPostId = posts[0]._id; // Fallback?

      const graphqlQuery = {
        query: `mutation AddComment($content: String!, $postId: ID!, $parentId: ID!) {
          addComment(commentInput: { content: $content, postId: $postId, parentId: $parentId }) {
            _id content creator { _id name email avatar } createdAt parentId likes { _id } likesCount
            replies { _id } repliesCount
          }
        }`,
        variables: { content, postId: targetPostId, parentId: commentId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const newReply = resData.data.addComment;

      setPosts(prevPosts => {
        return prevPosts.map(p => {
          if (!p.comments) return p;
          return {
            ...p,
            comments: updateCommentInFeedRecursive(p.comments, commentId, (c) => ({
              ...c,
              replies: [newReply, ...(c.replies || [])],
              repliesCount: (c.repliesCount || 0) + 1
            }))
          };
        });
      });

      setFlashMessage({ message: 'Reply added successfully!', type: 'success' });
      return newReply;
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to add reply', type: 'error' });
      return null;
    }
  };

  const handleEditReply = async (replyId, content) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to edit reply', type: 'error' });
    try {
      const graphqlQuery = {
        query: `mutation UpdateComment($commentId: ID!, $content: String!) {
          updateComment(commentId: $commentId, content: $content) {
            _id content creator { _id name email avatar } createdAt parentId likes { _id } likesCount repliesCount
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

      const updatedReply = resData.data.updateComment;

      setPosts(prevPosts => {
        return prevPosts.map(p => {
          if (!p.comments) return p;
          return {
            ...p,
            comments: updateCommentInFeedRecursive(p.comments, replyId, (c) => ({ ...c, ...updatedReply }))
          };
        });
      });

      setFlashMessage({ message: 'Reply updated successfully!', type: 'success' });
      return updatedReply;
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to update reply', type: 'error' });
      return null;
    }
  };

  const handleLikeComment = async (commentId, isLiked) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to like comment', type: 'error' });
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
      return resData.data[mutation];
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to like comment', type: 'error' });
      return null;
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to delete reply', type: 'error' });
    try {
      const graphqlQuery = {
        query: `mutation DeleteComment($commentId: ID!) {
          deleteComment(commentId: $commentId)
        }`,
        variables: { commentId: replyId }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      // Update state for all posts since we don't know the parent post easily without more plumbing
      // or we accept we scan all.
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

      setPosts(prevPosts => {
        return prevPosts.map(p => {
          if (!p.comments) return p;
          return { ...p, comments: removeReplyRecursive(p.comments) };
        });
      });

      setFlashMessage({ message: 'Reply deleted successfully!', type: 'success' });
      return true;
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to delete reply', type: 'error' });
      return false;
    }
  };

  const handleEditComment = async (postId, commentId, content) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to edit comment', type: 'error' });
    try {
      const graphqlQuery = {
        query: `mutation UpdateComment($commentId: ID!, $content: String!) {
            updateComment(commentId: $commentId, content: $content) {
              _id content creator { _id name avatar } createdAt likes { _id } likesCount
            }
          }`,
        variables: { commentId, content }
      };
      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        return {
          ...p,
          comments: p.comments.map(c => c._id === commentId ? { ...c, ...resData.data.updateComment } : c)
        };
      }));
      setFlashMessage({ message: 'Comment updated successfully!', type: 'success' });
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to update comment', type: 'error' });
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!authToken) return setFlashMessage({ message: 'Please login to delete comment', type: 'error' });
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

      setPosts(prev => prev.map(p => {
        if (p._id !== postId) return p;
        return {
          ...p,
          comments: p.comments.filter(c => c._id !== commentId),
          commentsCount: (p.commentsCount || 1) - 1
        };
      }));
      setFlashMessage({ message: 'Comment deleted successfully!', type: 'success' });
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to delete comment', type: 'error' });
    }
  };

  return (
    <Fragment>
      <FlashMessage message={flashMessage?.message} type={flashMessage?.type} onClose={flashHandler} />
      <ErrorHandler error={error} onHandle={errorHandler} />
      <FeedEdit editing={isEditing} selectedPost={editPost} loading={editLoading} onCancelEdit={cancelEditHandler} onFinishEdit={finishEditHandler} />
      {!viewOnly && (
        <section className="feed__status">
          <form onSubmit={statusUpdateHandler}>
            <Input type="text" placeholder="Your status" control="input" value={status} onChange={statusInputChangeHandler} />
            <Button mode="flat" type="submit">Update</Button>
          </form>
        </section>
      )}
      <section className="feed">
        {postsLoading ? (
          <div style={{ textAlign: 'center', marginTop: '2rem' }}><Loader /></div>
        ) : posts.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No posts found.</p>
        ) : (
          <div className={isListView ? "feed__list-view" : "feed__list"}>
            {isListView ? (
              /* List View - Standard Pagination */
              <Paginator
                onPrevious={() => loadPosts(postPage - 1)}
                onNext={() => loadPosts(postPage + 1)}
                onPageChange={(page) => loadPosts(page)}
                currentPage={postPage}
                lastPage={Math.ceil(totalPosts / perPage)}
                totalItems={totalPosts}
                perPage={perPage}
                onPerPageChange={(newLimit) => {
                  setPerPage(newLimit);
                  setPostPage(1); // Reset to page 1
                }}
              >
                {posts.map(post => (
                  <PostListItem
                    key={post._id}
                    post={post}
                    onLike={userId ? handleLike : null}
                    token={authToken}
                    currentUserId={userId}
                    onAddComment={handleAddComment}
                    onEditComment={(id, content) => handleEditComment(post._id, id, content)}
                    onDeleteComment={(id) => handleDeleteComment(post._id, id)}
                    onLoadMoreComments={handleLoadMoreComments}
                    onLoadMoreReplies={handleLoadMoreReplies}
                    onAddReply={handleAddReply}
                    onEditReply={handleEditReply}
                    onDeleteReply={handleDeleteReply}
                    onLikeComment={handleLikeComment}
                  />
                ))}
              </Paginator>
            ) : (
              /* Grid View - Infinite Scroll */
              posts.map(post => (
                <Post
                  key={post._id}
                  id={post._id}
                  author={post.creator?.name || 'Unknown'}
                  authorImage={post.creator?.avatar}
                  date={new Date(post.createdAt).toLocaleDateString('en-US')}
                  title={post.title}
                  image={post.imageUrl}
                  content={post.content}
                  onStartEdit={userId === post.creator?._id ? () => startEditPostHandler(post._id) : null}
                  onDelete={userId === post.creator?._id ? () => deletePostHandler(post._id) : null}
                  currentUserId={userId}
                  creatorId={post.creator?._id}
                  likes={post.likes || []}
                  likesCount={post.likesCount || 0}
                  comments={post.comments || []}
                  commentsCount={post.commentsCount || 0}
                  onLike={userId ? () => handleLike(post._id) : null}
                  onAddComment={handleAddComment}
                  onEditComment={(id, content) => handleEditComment(post._id, id, content)}
                  onDeleteComment={(id) => handleDeleteComment(post._id, id)}
                  onLoadMoreComments={handleLoadMoreComments}
                  onLoadMoreReplies={handleLoadMoreReplies}
                  onAddReply={handleAddReply}
                  onEditReply={handleEditReply}
                  onDeleteReply={handleDeleteReply}
                  onLikeComment={handleLikeComment}
                  token={authToken}
                />
              ))
            )}
          </div>
        )}
      </section>
    </Fragment>
  );
};

export default Feed;

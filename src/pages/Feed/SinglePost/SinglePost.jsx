import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Image from '../../../components/Image/Image';
import Loader from '../../../components/Loader/Loader';
import ErrorHandler from '../../../components/ErrorHandler/ErrorHandler';
import Comments from '../../../components/Comments/Comments';
import './SinglePost.css';

const SinglePost = ({ token }) => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const authToken = token || localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      setError(null);

      const graphqlQuery = {
        query: `
          query FetchPostWithComments($id: ID!) {
            post(id: $id) {
              _id
              title
              content
              imageUrl
              creator { _id name avatar }
              createdAt
              likesCount
              commentsCount
              comments {
                _id
                content
                creator { _id name avatar }
                createdAt
                parentId
                replies { _id content creator { _id name avatar } createdAt }
              }
            }
          }
        `,
        variables: { id: postId }
      };

      try {
        const res = await fetch('http://localhost:8080/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken && { Authorization: 'Bearer ' + authToken }),
          },
          body: JSON.stringify(graphqlQuery)
        });

        if (!res.ok) throw new Error('Failed to reach server');

        const resData = await res.json();
        if (resData.errors && resData.errors.length > 0) {
          throw new Error(resData.errors[0].message);
        }

        setPost(resData.data.post);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, authToken]);

  const errorHandler = () => setError(null);

  const imageUrl = post && post.imageUrl
    ? (post.imageUrl.startsWith('http') ? post.imageUrl : `http://localhost:8080/${post.imageUrl}`)
    : null;

  const handleAddComment = async (postId, content) => {
    try {
      const graphqlQuery = {
        query: `
          mutation AddComment($content: String!, $postId: ID!) {
            addComment(commentInput: { content: $content, postId: $postId }) {
              _id
              content
              creator { _id name avatar }
              createdAt
            }
          }
        `,
        variables: { content, postId }
      };

      const res = await fetch('http://localhost:8080/graphql', {
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
      setPost((prev) => ({
        ...prev,
        comments: prev.comments ? [newComment, ...prev.comments] : [newComment],
        commentsCount: (prev.commentsCount || 0) + 1
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add comment');
    }
  };

  const handleEditComment = async (commentId, content) => {
    try {
      const graphqlQuery = {
        query: `
          mutation UpdateComment($commentId: ID!, $content: String!) {
            updateComment(commentId: $commentId, content: $content) {
              _id
              content
              creator { _id name avatar }
              createdAt
            }
          }
        `,
        variables: { commentId, content }
      };

      const res = await fetch('http://localhost:8080/graphql', {
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
          c._id === commentId ? resData.data.updateComment : c
        )
      }));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const graphqlQuery = {
        query: `
          mutation DeleteComment($commentId: ID!) {
            deleteComment(commentId: $commentId)
          }
        `,
        variables: { commentId }
      };

      const res = await fetch('http://localhost:8080/graphql', {
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
      console.error(err);
      setError(err.message || 'Failed to delete comment');
    }
  };

  const handleAddReply = async (commentId, content) => {
    try {
      const graphqlQuery = {
        query: `
          mutation AddComment($content: String!, $postId: ID!, $parentId: ID!) {
            addComment(commentInput: { content: $content, postId: $postId, parentId: $parentId }) {
              _id content creator { _id name avatar } createdAt parentId
            }
          }
        `,
        variables: { content, postId, parentId: commentId }
      };

      const res = await fetch('http://localhost:8080/graphql', {
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
          c._id === commentId
            ? { ...c, replies: [...(c.replies || []), resData.data.addComment] }
            : c
        )
      }));

      return resData.data.addComment;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to add reply');
      return null;
    }
  };

  const handleEditReply = async (replyId, content) => {
    try {
      const graphqlQuery = {
        query: `
          mutation UpdateComment($commentId: ID!, $content: String!) {
            updateComment(commentId: $commentId, content: $content) {
              _id content creator { _id name avatar } createdAt parentId
            }
          }
        `,
        variables: { commentId: replyId, content }
      };
      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);
      return resData.data.updateComment;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to update reply');
      return null;
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      const graphqlQuery = {
        query: `mutation DeleteComment($commentId: ID!) { deleteComment(commentId: $commentId) }`,
        variables: { commentId: replyId }
      };
      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken },
        body: JSON.stringify(graphqlQuery)
      });
      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);
      return true;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete reply');
      return false;
    }
  };

  const handleLoadMoreComments = async (postId, page) => {
    try {
      const graphqlQuery = {
        query: `
          query PaginatedComments($postId: ID!, $page: Int!, $limit: Int!) {
            paginatedComments(postId: $postId, page: $page, limit: $limit) {
              comments {
                _id content creator { _id name avatar } createdAt parentId
                replies { _id content creator { _id name avatar } createdAt }
              }
              totalComments hasMore
            }
          }
        `,
        variables: { postId, page, limit: 5 }
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const result = resData.data.paginatedComments;
      setPost(prev => ({
        ...prev,
        comments: [...prev.comments, ...result.comments]
      }));
      return result;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load more comments');
      return { comments: [], hasMore: false };
    }
  };

  const handleLoadMoreReplies = async (commentId, page) => {
    try {
      const graphqlQuery = {
        query: `
          query PaginatedReplies($commentId: ID!, $page: Int!, $limit: Int!) {
            paginatedReplies(commentId: $commentId, page: $page, limit: $limit) {
              replies {
                _id content creator { _id name avatar } createdAt
              }
              totalReplies hasMore
            }
          }
        `,
        variables: { commentId, page, limit: 5 }
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken
        },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);
      return resData.data.paginatedReplies;
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load more replies');
      return { replies: [], hasMore: false };
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}><Loader /></div>;
  if (!post) return <section className="single-post" style={{ textAlign: 'center', padding: '2rem' }}><p>No post found.</p></section>;

  return (
    <section className="single-post">
      <ErrorHandler error={error} onHandle={errorHandler} />
      <h1>{post.title}</h1>
      <h2>Created by {post.creator?.name || 'Unknown'} on {new Date(post.createdAt).toLocaleDateString('en-US')}</h2>

      {imageUrl && imageUrl !== 'https://via.placeholder.com/150' && (
        <div className="single-post__image" style={{ margin: '1rem 0' }}>
          <Image contain imageUrl={imageUrl} />
        </div>
      )}

      <p className="single-post__content">{post.content}</p>

      <Comments
        comments={post.comments || []}
        postId={postId}
        currentUserId={currentUserId}
        token={authToken}
        onAddComment={handleAddComment}
        onEditComment={handleEditComment}
        onDeleteComment={handleDeleteComment}
        onAddReply={handleAddReply}
        onEditReply={handleEditReply}
        onDeleteReply={handleDeleteReply}
        onLoadMoreComments={handleLoadMoreComments}
        onLoadMoreReplies={handleLoadMoreReplies}
      />
    </section>
  );
};

export default SinglePost;

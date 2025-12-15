import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Image from '../../../components/Image/Image';
import Loader from '../../../components/Loader/Loader';
import ErrorHandler from '../../../components/ErrorHandler/ErrorHandler';
import Comments from '../../../components/Comments/Comments';
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
        const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
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
        setError(err.message || 'Failed to fetch post');
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, authToken]);

  const errorHandler = () => setError(null);

  /* ✅ FIXED IMAGE URL */
  const imageUrl = post?.imageUrl
    ? getImageUrl(post.imageUrl)
    : null;

  /* ---------------- COMMENTS HANDLERS (UNCHANGED) ---------------- */

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
              _id content creator { _id name avatar } createdAt
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
          c._id === commentId ? resData.data.updateComment : c
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

  /* ---------------- RENDER ---------------- */

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
    <section className="single-post">
      <ErrorHandler error={error} onHandle={errorHandler} />

      <h1>{post.title}</h1>
      <h2>
        Created by {post.creator?.name || 'Unknown'} on{' '}
        {new Date(post.createdAt).toLocaleDateString('en-US')}
      </h2>

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
      />
    </section>
  );
};

export default SinglePost;

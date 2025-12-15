import React, { useState, useEffect } from 'react';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import FlashMessage from '../../components/FlashMessage/FlashMessage';
import './AdminDashboard.css';

const AdminDashboard = ({ token, currentUserId }) => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        await fetchUsers();
      } else {
        await fetchPosts();
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const graphqlQuery = {
      query: `
        query {
          users {
            _id
            name
            email
            role
            status
          }
        }
      `,
    };

    const res = await fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(graphqlQuery),
    });

    const resData = await res.json();
    if (resData.errors) throw new Error(resData.errors[0].message);
    setUsers(resData.data.users || []);
  };

  const fetchPosts = async () => {
    const graphqlQuery = {
      query: `
        query {
          posts(page: 1) {
            posts {
              _id
              title
              creator {
                _id
                name
              }
              createdAt
            }
            totalPosts
          }
        }
      `,
    };

    const res = await fetch('http://localhost:8080/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(graphqlQuery),
    });

    const resData = await res.json();
    if (resData.errors) throw new Error(resData.errors[0].message);
    setPosts(resData.data.posts.posts || []);
  };

  const handleMakeAdmin = async (userId) => {
    try {
      const graphqlQuery = {
        query: `
          mutation MakeAdmin($userId: ID!) {
            makeAdmin(userId: $userId) {
              _id
              role
            }
          }
        `,
        variables: { userId },
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      setFlashMessage({ message: 'User promoted to admin!', type: 'success' });
      fetchUsers();
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to make admin', type: 'error' });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const graphqlQuery = {
        query: `
          mutation DeleteUser($userId: ID!) {
            deleteUser(userId: $userId)
          }
        `,
        variables: { userId },
      };

      const res = await fetch('http://localhost:8080/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      setFlashMessage({ message: 'User deleted successfully!', type: 'success' });
      fetchUsers();
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to delete user', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Loader />
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <FlashMessage 
        message={flashMessage?.message} 
        type={flashMessage?.type}
        onClose={() => setFlashMessage(null)}
      />
      <ErrorHandler error={error} onHandle={() => setError(null)} />
      
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users ({users.length})
        </button>
        <button 
          className={activeTab === 'posts' ? 'active' : ''}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({posts.length})
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'users' ? (
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{user.status || 'N/A'}</td>
                    <td>
                      <div className="admin-actions">
                        {user.role !== 'admin' && (
                          <Button 
                            mode="flat" 
                            onClick={() => handleMakeAdmin(user._id)}
                          >
                            Make Admin
                          </Button>
                        )}
                        {user._id !== currentUserId && (
                          <Button 
                            mode="flat" 
                            design="danger"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-posts">
            {posts.map(post => (
              <div key={post._id} className="admin-post-item">
                <h3>{post.title}</h3>
                <p>By: {post.creator?.name || 'Unknown'}</p>
                <p>Date: {new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;


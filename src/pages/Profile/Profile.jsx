import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Input from '../../components/Form/Input/Input';
import FilePicker from '../../components/Form/Input/FilePicker';
import Image from '../../components/Image/Image';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import FlashMessage from '../../components/FlashMessage/FlashMessage';
import { required } from '../../util/validators';
import { generateBase64FromImage } from '../../util/image';
import './Profile.css';

/* ✅ Helper: replaces localhost safely */
const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http')
    ? path
    : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const Profile = ({ token, currentUserId }) => {
  const { userId: paramUserId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true');
  const [error, setError] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);

  const [formData, setFormData] = useState({
    name: { value: '', valid: false, touched: false, validators: [required] },
    username: { value: '', valid: true, touched: false, validators: [] },
    bio: { value: '', valid: true, touched: false, validators: [] },
    status: { value: '', valid: true, touched: false, validators: [] }
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [formIsValid, setFormIsValid] = useState(false);

  const targetUserId = paramUserId || currentUserId;
  const isOwnProfile = !paramUserId || targetUserId === currentUserId;

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      setLoading(true);

      const graphqlQuery = {
        query: `
          query GetUser($userId: ID!) {
            userById(userId: $userId) {
              _id
              name
              username
              email
              bio
              status
              role
              avatar
            }
          }
        `,
        variables: { userId: targetUserId },
      };

      try {
        const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify(graphqlQuery),
        });

        const resData = await res.json();
        if (resData.errors) throw new Error(resData.errors[0].message);

        const userData = resData.data.userById;
        setUser(userData);

        setFormData(prev => ({
          name: { ...prev.name, value: userData.name, valid: true },
          username: { ...prev.username, value: userData.username || '', valid: true },
          bio: { ...prev.bio, value: userData.bio || '', valid: true },
          status: { ...prev.status, value: userData.status || '', valid: true }
        }));

        if (userData.avatar) {
          setAvatarPreview(getImageUrl(userData.avatar));
        }

        setFormIsValid(true);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch user');
        setLoading(false);
      }
    };

    fetchUser();
  }, [targetUserId, currentUserId, token, navigate]);

  const inputChangeHandler = (input, value, files) => {
    if (input === 'avatar' && files && files[0]) {
      setAvatarFile(files[0]);
      generateBase64FromImage(files[0])
        .then(b64 => setAvatarPreview(b64))
        .catch(() => setAvatarPreview(null));
      return;
    }

    setFormData(prevForm => {
      const isValid = prevForm[input].validators.every(v => v(value));
      const updatedForm = {
        ...prevForm,
        [input]: {
          ...prevForm[input],
          value,
          valid: isValid,
          touched: true
        }
      };
      setFormIsValid(Object.values(updatedForm).every(f => f.valid));
      return updatedForm;
    });
  };

  const handleSave = async () => {
    if (!formIsValid || !isOwnProfile) return;

    try {
      let avatarUrl = user?.avatar || '';

      if (avatarFile) {
        const fd = new FormData();
        fd.append('image', avatarFile);
        if (user?.avatar) fd.append('oldPath', user.avatar);

        const uploadRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/post-image`,
          {
            method: 'PUT',
            headers: { Authorization: 'Bearer ' + token },
            body: fd,
          }
        );

        if (!uploadRes.ok) throw new Error('Failed to upload avatar');
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.filePath;
      }

      const graphqlQuery = {
        query: `
          mutation UpdateUser($name: String, $username: String, $bio: String, $status: String, $avatar: String) {
            updateUser(userInput: { name: $name, username: $username, bio: $bio, status: $status, avatar: $avatar }) {
              _id
              name
              username
              email
              bio
              status
              avatar
            }
          }
        `,
        variables: {
          name: formData.name.value,
          username: formData.username.value,
          bio: formData.bio.value,
          status: formData.status.value,
          avatar: avatarUrl
        },
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const updatedUser = resData.data.updateUser;
      setUser(updatedUser);
      setAvatarPreview(getImageUrl(updatedUser.avatar));

      setAvatarFile(null);
      setEditing(false);
      navigate(`/profile/${targetUserId}`, { replace: true });

      setFlashMessage({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to update profile', type: 'error' });
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem' }}><Loader /></div>;
  }

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="profile-page">
      <FlashMessage message={flashMessage?.message} type={flashMessage?.type} onClose={() => setFlashMessage(null)} />
      <ErrorHandler error={error} onHandle={() => setError(null)} />

      <div className="profile-header">
        <div className="profile-avatar">
          {avatarPreview ? (
            <img src={getImageUrl(avatarPreview)} alt={user.name} />
          ) : user.avatar ? (
            <img src={getImageUrl(user.avatar)} alt={user.name} />
          ) : (
            <div className="profile-avatar-placeholder">{initials}</div>
          )}
        </div>
        <h1>{user.name}</h1>
        {user.username && <p className="profile-username">@{user.username}</p>}
        {user.role === 'admin' && <span className="profile-badge">Admin</span>}
      </div>

      <div className="profile-content">
        <div className="profile-info">
          <div className="profile-field">
            <label>Email</label>
            <p>{user.email}</p>
          </div>

          {editing && isOwnProfile ? (
            <>
              <FilePicker id="avatar" label="Profile Picture" onChange={inputChangeHandler} />
              <Input id="name" label="Name" control="input" value={formData.name.value} onChange={inputChangeHandler} />
              <Input id="username" label="Username" control="input" value={formData.username.value} onChange={inputChangeHandler} />
              <Input id="bio" label="Bio" control="textarea" value={formData.bio.value} onChange={inputChangeHandler} />
              <Input id="status" label="Status" control="input" value={formData.status.value} onChange={inputChangeHandler} />

              <div className="profile-actions">
                <Button mode="raised" onClick={handleSave}>Save</Button>
                <Button mode="flat" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </>
          ) : (
            <>
              {user.bio && <p>{user.bio}</p>}
              <p>{user.status}</p>
              {isOwnProfile && <Button onClick={() => setEditing(true)}>Edit Profile</Button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

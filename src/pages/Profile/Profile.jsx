import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/Button/Button';
import Input from '../../components/Form/Input/Input';
import FilePicker from '../../components/Form/Input/FilePicker';
import Loader from '../../components/Loader/Loader';
import ErrorHandler from '../../components/ErrorHandler/ErrorHandler';
import FlashMessage from '../../components/FlashMessage/FlashMessage';
import FollowButton from '../../components/FollowButton/FollowButton';
import SocialModal from '../../components/SocialModal/SocialModal';
import PostGridModal from '../../components/PostGridModal/PostGridModal';
import { required } from '../../util/validators';
import { generateBase64FromImage } from '../../util/image';
import './Profile.css';

const getImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${import.meta.env.VITE_BACKEND_URL}/${path}`;
};

const Profile = ({ token, currentUserId, onLogout }) => {
  const { userId: paramUserId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true');
  const [error, setError] = useState(null);
  const [flashMessage, setFlashMessage] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

  // Social modals
  const [showComments, setShowComments] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [modalLoadingUserId, setModalLoadingUserId] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Post grid modal
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);

  const [formData, setFormData] = useState({
    name: { value: '', valid: false, touched: false, validators: [required] },
    username: { value: '', valid: true, touched: false, validators: [] },
    bio: { value: '', valid: true, touched: false, validators: [] }
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
              _id name username email bio role avatar
              savedPosts { _id title content imageUrl creator { _id name avatar } likes { _id } likesCount commentsCount createdAt }
              posts { _id title content imageUrl creator { _id name avatar } likes { _id } likesCount commentsCount createdAt }
              followers { _id name username avatar }
              following { _id name username avatar }
              followersCount followingCount postsCount
            }
          }
        `,
        variables: { userId: targetUserId },
      };

      try {
        const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify(graphqlQuery),
        });

        const resData = await res.json();
        if (resData.errors) throw new Error(resData.errors[0].message);

        const userData = resData.data.userById;
        setUser(userData);

        setFormData(prev => ({
          name: { ...prev.name, value: userData.name, valid: true },
          username: { ...prev.username, value: userData.username || '', valid: true },
          bio: { ...prev.bio, value: userData.bio || '', valid: true }
        }));

        if (userData.avatar) setAvatarPreview(getImageUrl(userData.avatar));
        setFormIsValid(true);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch user');
        setLoading(false);
      }
    };

    fetchUser();
  }, [targetUserId, currentUserId, token, navigate]);

  const handleFollow = async () => {
    if (!token || isOwnProfile) return;
    setFollowLoading(true);

    const isFollowing = user.followers.some(f => f._id === currentUserId);
    const mutation = isFollowing ? 'unfollowUser' : 'followUser';

    try {
      const graphqlQuery = {
        query: `mutation ${isFollowing ? 'Unfollow' : 'Follow'}($userId: ID!) {
          ${mutation}(userId: $userId) {
            _id followers { _id } following { _id } followersCount followingCount
          }
        }`,
        variables: { userId: targetUserId }
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      // Optimistic update
      setUser(prev => ({
        ...prev,
        followers: isFollowing
          ? prev.followers.filter(f => f._id !== currentUserId)
          : [...prev.followers, { _id: currentUserId }],
        followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      }));

      setFollowLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to follow/unfollow');
      setFollowLoading(false);
    }
  };

  const handleModalFollowToggle = async (userId) => {
    if (!token) return;
    setModalLoadingUserId(userId);

    const isFollowing = user.following?.some(u => u._id === userId);
    const mutation = isFollowing ? 'unfollowUser' : 'followUser';

    try {
      const graphqlQuery = {
        query: `mutation ${isFollowing ? 'Unfollow' : 'Follow'}($userId: ID!) {
          ${mutation}(userId: $userId) {
            _id followers { _id name username avatar } following { _id name username avatar } followersCount followingCount
          }
        }`,
        variables: { userId }
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(graphqlQuery)
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      // Update the current user's following list
      const updatedData = resData.data[mutation];
      setUser(prev => ({
        ...prev,
        following: updatedData.following,
        followingCount: updatedData.followingCount
      }));

      setModalLoadingUserId(null);
    } catch (err) {
      setError(err.message || 'Failed to follow/unfollow');
      setModalLoadingUserId(null);
    }
  };

  const handleOpenPost = (post, index) => {
    setSelectedPost(post);
    setSelectedPostIndex(index);
  };

  const handleClosePostModal = () => {
    setSelectedPost(null);
    setSelectedPostIndex(0);
  };

  const handleNextPost = () => {
    const currentPosts = searchParams.get('tab') === 'saved' ? user.savedPosts : user.posts;
    if (selectedPostIndex < currentPosts.length - 1) {
      const nextIndex = selectedPostIndex + 1;
      setSelectedPostIndex(nextIndex);
      setSelectedPost(currentPosts[nextIndex]);
    }
  };

  const handlePreviousPost = () => {
    const currentPosts = searchParams.get('tab') === 'saved' ? user.savedPosts : user.posts;
    if (selectedPostIndex > 0) {
      const prevIndex = selectedPostIndex - 1;
      setSelectedPostIndex(prevIndex);
      setSelectedPost(currentPosts[prevIndex]);
    }
  };

  const inputChangeHandler = (input, value, files) => {
    if (input === 'avatar' && files && files[0]) {
      setAvatarFile(files[0]);
      generateBase64FromImage(files[0])
        .then(b64 => setAvatarPreview(b64))
        .catch(() => { });
      return;
    }

    // Safety check: only update if field exists in formData
    if (!formData[input]) {
      console.warn(`Field ${input} does not exist in formData`);
      return;
    }

    setFormData(prevForm => {
      const isValid = prevForm[input].validators.every(v => v(value));
      const updatedForm = {
        ...prevForm,
        [input]: { ...prevForm[input], value, valid: isValid, touched: true }
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

        const uploadRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/post-image`, {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + token },
          body: fd,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload avatar');
        const uploadData = await uploadRes.json();
        avatarUrl = uploadData.filePath;
      }

      const graphqlQuery = {
        query: `mutation UpdateUser($name: String, $username: String, $bio: String, $avatar: String) {
          updateUser(userInput: { name: $name, username: $username, bio: $bio, avatar: $avatar }) {
            _id name username email bio avatar
          }
        }`,
        variables: {
          name: formData.name.value,
          username: formData.username.value,
          bio: formData.bio.value,
          avatar: avatarUrl
        },
      };

      const res = await fetch(import.meta.env.VITE_GRAPHQL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(graphqlQuery),
      });

      const resData = await res.json();
      if (resData.errors) throw new Error(resData.errors[0].message);

      const updatedUser = resData.data.updateUser;
      setUser(prev => ({ ...prev, ...updatedUser }));
      setAvatarPreview(getImageUrl(updatedUser.avatar));
      setAvatarFile(null);
      setEditing(false);
      // Dispatch event to notify other components (like navbar) to refresh
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      navigate(`/profile/${targetUserId}`, { replace: true });
      setFlashMessage({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setFlashMessage({ message: err.message || 'Failed to update profile', type: 'error' });
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}><Loader /></div>;
  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const isFollowing = user.followers?.some(f => f._id === currentUserId);

  return (
    <div className="profile-page-instagram">
      <FlashMessage message={flashMessage?.message} type={flashMessage?.type} onClose={() => setFlashMessage(null)} />
      <ErrorHandler error={error} onHandle={() => setError(null)} />

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header-instagram">
          <div className="profile-avatar-large">
            {avatarPreview || user.avatar ? (
              <img src={getImageUrl(avatarPreview || user.avatar)} alt={user.name} />
            ) : (
              <div className="profile-avatar-placeholder-large">{initials}</div>
            )}
          </div>

          <div className="profile-info-instagram">
            <div className="profile-top-row">
              <h1 className="profile-username-large">{user.username || user.name}</h1>
              {isOwnProfile && (
                <>
                  <button className="profile-menu-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                    ☰
                  </button>
                  {showProfileMenu && (
                    <>
                      <div className="profile-menu-backdrop" onClick={() => setShowProfileMenu(false)} />
                      <div className="profile-menu-dropdown">
                        <button onClick={() => { setEditing(true); setShowProfileMenu(false); }}>
                          Edit Profile
                        </button>
                        <button onClick={() => { navigate(`/profile/${currentUserId}?tab=saved`); setShowProfileMenu(false); }}>
                          Saved Posts
                        </button>
                        <button onClick={() => { setShowProfileMenu(false); onLogout(); }} className="profile-menu-logout">
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="profile-stats">
              <div className="profile-stat">
                <span className="stat-count">{user.postsCount || 0}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="profile-stat" onClick={() => setShowFollowersModal(true)} style={{ cursor: 'pointer' }}>
                <span className="stat-count">{user.followersCount || 0}</span>
                <span className="stat-label">followers</span>
              </div>
              <div className="profile-stat" onClick={() => setShowFollowingModal(true)} style={{ cursor: 'pointer' }}>
                <span className="stat-count">{user.followingCount || 0}</span>
                <span className="stat-label">following</span>
              </div>
            </div>

            <div className="profile-bio-section">
              {user.bio && <p className="profile-bio-text">{user.bio}</p>}
              {user.name && <p className="profile-bio-text">{user.name}</p>}
            </div>

            {/* Action buttons below bio */}
            <div className="profile-actions-row">
              {isOwnProfile ? (
                <Button mode="flat" design="raised" onClick={() => setEditing(true)}>Edit Profile</Button>
              ) : (
                <FollowButton isFollowing={isFollowing} isOwnProfile={false} onFollow={handleFollow} loading={followLoading} />
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        {editing && isOwnProfile && (
          <div className="profile-edit-section">
            <FilePicker id="avatar" label="Profile Picture" onChange={inputChangeHandler} />
            <Input id="name" label="Name" control="input" value={formData.name.value} onChange={inputChangeHandler} />
            <Input id="username" label="Username" control="input" value={formData.username.value} onChange={inputChangeHandler} />
            <Input id="bio" label="Bio" control="textarea" value={formData.bio.value} onChange={inputChangeHandler} />
            <div className="profile-actions">
              <Button mode="raised" onClick={handleSave}>Save</Button>
              <Button mode="flat" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Tabs for own profile */}
        {!editing && isOwnProfile && (
          <div className="profile-tabs">
            <button
              className={`profile-tab ${searchParams.get('tab') !== 'saved' ? 'active' : ''}`}
              onClick={() => navigate(`/profile/${currentUserId}`)}
            >
              <span>📱</span> POSTS
            </button>
            <button
              className={`profile-tab ${searchParams.get('tab') === 'saved' ? 'active' : ''}`}
              onClick={() => navigate(`/profile/${currentUserId}?tab=saved`)}
            >
              <span>🔖</span> SAVED
            </button>
          </div>
        )}

        {/* Posts Grid */}
        {!editing && (
          <div className="profile-posts-grid">
            {searchParams.get('tab') === 'saved' && isOwnProfile ? (
              // Show saved posts
              user.savedPosts && user.savedPosts.length > 0 ? (
                user.savedPosts.map((post, index) => {
                  const postImageUrl = post.imageUrl ? getImageUrl(post.imageUrl) : null;
                  return (
                    <div
                      key={post._id}
                      className="grid-post-item"
                      onClick={() => handleOpenPost(post, index)}
                    >
                      {postImageUrl ? (
                        <img src={postImageUrl} alt={post.title} />
                      ) : (
                        <div className="grid-post-no-image">
                          <div className="grid-post-text-preview">
                            <h4>{post.title}</h4>
                            {post.content && <p>{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="profile-empty-state">No saved posts yet</div>
              )
            ) : (
              // Show user's posts
              user.posts && user.posts.length > 0 ? (
                user.posts.map((post, index) => {
                  const postImageUrl = post.imageUrl ? getImageUrl(post.imageUrl) : null;
                  return (
                    <div
                      key={post._id}
                      className="grid-post-item"
                      onClick={() => handleOpenPost(post, index)}
                    >
                      {postImageUrl ? (
                        <img src={postImageUrl} alt={post.title} />
                      ) : (
                        <div className="grid-post-no-image">
                          <div className="grid-post-text-preview">
                            <h4>{post.title}</h4>
                            {post.content && <p>{post.content.substring(0, 100)}{post.content.length > 100 ? '...' : ''}</p>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="profile-empty-state">No posts yet</div>
              )
            )}
          </div>
        )}
      </div>

      {/* Post Grid Modal */}
      {selectedPost && (
        <PostGridModal
          post={selectedPost}
          posts={searchParams.get('tab') === 'saved' ? user.savedPosts : user.posts}
          currentIndex={selectedPostIndex}
          onClose={handleClosePostModal}
          onNext={handleNextPost}
          onPrevious={handlePreviousPost}
        />
      )}

      {/* Social Modals */}
      <SocialModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        title="Followers"
        users={user.followers || []}
        currentUserId={currentUserId}
        onFollowToggle={handleModalFollowToggle}
        followingIds={user.following?.map(u => u._id) || []}
        loadingUserId={modalLoadingUserId}
      />

      <SocialModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        title="Following"
        users={user.following || []}
        currentUserId={currentUserId}
        onFollowToggle={handleModalFollowToggle}
        followingIds={user.following?.map(u => u._id) || []}
        loadingUserId={modalLoadingUserId}
      />
    </div>
  );
};

export default Profile;

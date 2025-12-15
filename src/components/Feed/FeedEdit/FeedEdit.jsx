import React, { useState, useEffect, Fragment } from 'react';

import Backdrop from '../../Backdrop/Backdrop';
import Modal from '../../Modal/Modal';
import Input from '../../Form/Input/Input';
import FilePicker from '../../Form/Input/FilePicker';
import Image from '../../Image/Image';
import { required, length } from '../../../util/validators';
import { generateBase64FromImage } from '../../../util/image';

const POST_FORM = {
  title: {
    value: '',
    valid: false,
    touched: false,
    validators: [required, length({ min: 3 })]
  },
  image: {
    value: '',
    valid: true, 
    touched: false,
    validators: []
  },
  content: {
    value: '',
    valid: false,
    touched: false,
    validators: [required, length({ min: 5 })]
  }
};

const FeedEdit = ({ editing, selectedPost, onCancelEdit, onFinishEdit, loading }) => {
  const [postForm, setPostForm] = useState(POST_FORM);
  const [formIsValid, setFormIsValid] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (editing && selectedPost) {
      const updatedForm = {
        title: { ...POST_FORM.title, value: selectedPost.title, valid: true },
        image: { ...POST_FORM.image, value: selectedPost.imageUrl || '', valid: true },
        content: { ...POST_FORM.content, value: selectedPost.content, valid: true }
      };
      setPostForm(updatedForm);
      setFormIsValid(true);
      if (selectedPost.imageUrl) {
        setImagePreview(selectedPost.imageUrl);
      }
    } else if (editing && !selectedPost) {
      setPostForm(POST_FORM);
      setFormIsValid(false);
      setImagePreview(null);
    } else if (!editing) {
      setPostForm(POST_FORM);
      setFormIsValid(false);
      setImagePreview(null);
    }
  }, [editing, selectedPost]);

  const postInputChangeHandler = (input, value, files) => {
    if (input === 'image' && files && files[0]) {
      generateBase64FromImage(files[0])
        .then(b64 => setImagePreview(b64))
        .catch(() => setImagePreview(null));
    }

    setPostForm(prevForm => {
      let isValid = true;
      
      if (input === 'image') {
        
        isValid = true;
      } else {
        isValid = prevForm[input].validators.every(validator => validator(value));
      }
      
      const updatedForm = {
        ...prevForm,
        [input]: {
          ...prevForm[input],
          value: files ? files[0] : value,
          valid: isValid,
          touched: true
        }
      };

      const formValid = Object.values(updatedForm).every(field => field.valid);
      setFormIsValid(formValid);

      return updatedForm;
    });
  };

  const inputBlurHandler = input => {
    setPostForm(prevForm => ({
      ...prevForm,
      [input]: {
        ...prevForm[input],
        touched: true
      }
    }));
  };

  const cancelPostChangeHandler = () => {
    setPostForm(POST_FORM);
    setFormIsValid(false);
    setImagePreview(null);
    onCancelEdit();
  };

  const acceptPostChangeHandler = () => {
    const imageValue = postForm.image.value;
    const post = {
      title: postForm.title.value,
      content: postForm.content.value,
      image: imageValue instanceof File ? imageValue : null, // File object if new image selected
      imageUrl: typeof imageValue === 'string' ? imageValue : (selectedPost?.imageUrl || null) // String URL if existing or editing
    };
    onFinishEdit(post);
    setPostForm(POST_FORM);
    setFormIsValid(false);
    setImagePreview(null);
  };

  if (!editing) return null;

  return (
    <Fragment>
      <Backdrop open={editing} onClick={cancelPostChangeHandler} />
      <Modal
        title={selectedPost ? "Edit Note" : "New Note"}
        acceptEnabled={formIsValid}
        onCancelModal={cancelPostChangeHandler}
        onAcceptModal={acceptPostChangeHandler}
        isLoading={loading}
        selectedPost={selectedPost}
      >
        <form onSubmit={(e) => { e.preventDefault(); acceptPostChangeHandler(); }}>
          <Input
            id="title"
            label="Title"
            control="input"
            onChange={postInputChangeHandler}
            onBlur={() => inputBlurHandler('title')}
            valid={postForm.title.valid}
            touched={postForm.title.touched}
            value={postForm.title.value}
            placeholder="Enter note title..."
          />
          <FilePicker
            id="image"
            label="Image (Optional)"
            onChange={postInputChangeHandler}
            onBlur={() => inputBlurHandler('image')}
            valid={postForm.image.valid}
            touched={postForm.image.touched}
          />
          {imagePreview && (
            <div style={{ margin: '1rem 0', textAlign: 'center' }}>
              <Image imageUrl={imagePreview} contain left />
            </div>
          )}
          {selectedPost && !imagePreview && selectedPost.imageUrl && (
            <div style={{ margin: '1rem 0', textAlign: 'center' }}>
              <p>Current image:</p>
              <Image imageUrl={selectedPost.imageUrl} contain left />
            </div>
          )}
          <Input
            id="content"
            label="Content"
            control="textarea"
            rows="6"
            onChange={postInputChangeHandler}
            onBlur={() => inputBlurHandler('content')}
            valid={postForm.content.valid}
            touched={postForm.content.touched}
            value={postForm.content.value}
            placeholder="Write your note here..."
          />
        </form>
      </Modal>
    </Fragment>
  );
};

export default FeedEdit;

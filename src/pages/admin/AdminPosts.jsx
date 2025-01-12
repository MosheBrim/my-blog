import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import {
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaTrashAlt,
  FaUpload,
} from "react-icons/fa";
import getServiceUrl from '../../Service';


export default function AdminPosts() {
  const serviceUrl = getServiceUrl();
  const { user } = useParams();
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [newPost, setNewPost] = useState({
    author: user,
    title: "",
    description: "",
    data: "",
    published: false,
    image:
      "https://res.cloudinary.com/dne5dplkd/image/upload/v1716829443/nrot9cbvcvcrj04zo5i0.jpg",
  });
  const [editPost, setEditPost] = useState({
    id: null,
    author: "",
    title: "",
    description: "",
    data: "",
    published: false,
    image:
      "https://res.cloudinary.com/dne5dplkd/image/upload/v1716829443/nrot9cbvcvcrj04zo5i0.jpg",
  });

  const widgetRef = useRef();
  const queryClient = useQueryClient();
  const formStateRef = useRef(newPost);

  useEffect(() => {
    const loadCloudinary = async () => {
      const cloudinary = await window.cloudinary;
      if (cloudinary) {
        widgetRef.current = cloudinary.createUploadWidget(
          {
            cloudName: "dne5dplkd",
            uploadPreset: "nh9q390o",
          },
          (error, result) => {
            if (!error && result && result.event === "success") {
              const publicId = result.info.public_id;
              const imageUrl = result.info.secure_url;
              if (formStateRef.current === newPost) {
                setNewPost((prevPost) => ({ ...prevPost, image: imageUrl }));
              } else {
                setEditPost((prevPost) => ({ ...prevPost, image: imageUrl }));
              }

              console.log("Uploaded successfully. Public ID:", publicId);
              console.log("Image URL:", imageUrl);
            }
          }
        );
      } else {
        console.error("Cloudinary library not loaded");
      }
    };

    loadCloudinary();
  }, [newPost]);

  const posts = useQuery({
    queryKey: ["allPosts"],
    queryFn: () =>
      axios
        .get(`${serviceUrl}/admin/posts/${user}`)
        .then((res) => res.data),
  });

  useEffect(() => {
    if (user) {
      posts.refetch();
    }
  }, [user]);

  const sendNewPost = useMutation({
    mutationFn: (newPost) =>
      axios.post(
        `${serviceUrl}/admin/posts/${user}`,
        newPost
      ),
    onSuccess: (response) => {
      console.log(response.data);
      queryClient.invalidateQueries("allPosts");
      setNewPost({
        author: user,
        title: "",
        description: "",
        data: "",
        published: false,
        image:
          "https://res.cloudinary.com/dne5dplkd/image/upload/v1716829443/nrot9cbvcvcrj04zo5i0.jpg",
      });
      setShowAddPostModal(false);
    },
  });

  const updatePost = useMutation({
    mutationFn: (updatedPost) =>
      axios.put(
        `${serviceUrl}/admin/posts/${user}/${updatedPost.id}`,
        updatedPost
      ),
    onSuccess: () => {
      queryClient.invalidateQueries("allPosts");
      setShowEditPostModal(false);
    },
  });

  const deletePost = useMutation({
    mutationFn: (postId) =>
      axios.delete(
        `${serviceUrl}/admin/posts/${user}/${postId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries("allPosts");
      setShowDeleteConfirmModal(false);
      setShowEditPostModal(false);
    },
  });

  const togglePublishStatus = useMutation({
    mutationFn: (postId) =>
      axios.get(
        `${serviceUrl}/admin/posts/publish/${user}/${postId}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries("allPosts");
      // alert("Post publication status updated successfully!");
    },
  });

  if (
    posts.isLoading ||
    sendNewPost.isPending ||
    updatePost.isPending ||
    deletePost.isPending ||
    togglePublishStatus.isPending
  ) {
    return (
      <div
        className="d-flex justify-content-center align-items-center custom-spinner-color"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border custom-spinner-color" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (
    posts.isError ||
    sendNewPost.isError ||
    updatePost.isError ||
    deletePost.isError ||
    togglePublishStatus.isError
  ) {
    console.log(
      posts.error +
        sendNewPost.error +
        updatePost.error +
        deletePost.error +
        togglePublishStatus.error
    );
    return <div className="alert alert-danger">Error</div>;
  }

  const handleAddPost = () => {
    sendNewPost.mutate(newPost);
  };

  const handlePostInputChange = (e) => {
    const { name, value } = e.target;
    setNewPost((prevPost) => ({ ...prevPost, [name]: value }));
    formStateRef.current = { ...formStateRef.current, [name]: value };
  };

  const handlePublishedChange = () => {
    setNewPost((prevPost) => ({ ...prevPost, published: !prevPost.published }));
    formStateRef.current = {
      ...formStateRef.current,
      published: !formStateRef.current.published,
    };
  };

  const handleTogglePublishStatus = (postId) => {
    togglePublishStatus.mutate(postId);
  };

  const handleEditPost = (post) => {
    setEditPost(post);
    setShowEditPostModal(true);
  };

  const handleEditPostInputChange = (e) => {
    setEditPost((prevPost) => ({
      ...prevPost,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditPublishedChange = () => {
    setEditPost((prevPost) => ({
      ...prevPost,
      published: !prevPost.published,
    }));
  };

  const handleUpdatePost = () => {
    updatePost.mutate(editPost);
  };

  const handleDeletePost = () => {
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    deletePost.mutate(editPost.id);
  };

  return (
    <div className="admin container mt-5">
      <h2 className="mb-4">Manage Posts</h2>
      <button
        className="btn btn-blog btn-primary mb-3"
        onClick={() => setShowAddPostModal(true)}
      >
        Add Post
      </button>

      <Modal show={showAddPostModal} onHide={() => setShowAddPostModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">
            <label htmlFor="title" className="form-label">
              Title
            </label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              value={newPost.title}
              onChange={handlePostInputChange}
            />
          </div>
          <div className="mb-2">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <input
              type="text"
              className="form-control"
              id="description"
              name="description"
              value={newPost.description}
              onChange={handlePostInputChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="data" className="form-label">
              Content
            </label>
            <textarea
              className="form-control"
              id="data"
              name="data"
              rows="3"
              value={newPost.data}
              onChange={handlePostInputChange}
            ></textarea>
          </div>
          <div className="form-check mb-3">
            <input
              className="form-check-input check-blog"
              type="checkbox"
              id="published"
              checked={newPost.published}
              onChange={handlePublishedChange}
            />
            <label className="form-check-label" htmlFor="published">
              Publish Post
            </label>
          </div>
          <div>
            <button
              className="btn btn-blog btn-success"
              onClick={() => {
                formStateRef.current = newPost;
                widgetRef.current.open();
              }}
            >
              <FaUpload className="me-2" />
              Upload Image
            </button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-blog-cancel btn-secondary"
            onClick={() => setShowAddPostModal(false)}
          >
            Cancel
          </button>
          <button className="btn btn-blog btn-success" onClick={handleAddPost}>
            Submit Post
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={showEditPostModal}
        onHide={() => setShowEditPostModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className=" mb-2">
            <label htmlFor="title" className="form-label">
              Title
            </label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              value={editPost.title}
              onChange={handleEditPostInputChange}
            />
          </div>
          <div className="mb-2">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <input
              type="text"
              className="form-control"
              id="description"
              name="description"
              value={editPost.description}
              onChange={handleEditPostInputChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="data" className="form-label">
              Content
            </label>
            <textarea
              className="form-control"
              id="data"
              name="data"
              rows="3"
              value={editPost.data}
              onChange={handleEditPostInputChange}
            ></textarea>
          </div>
          <div className="form-check mb-3">
            <input
              className="form-check-input check-blog"
              type="checkbox"
              id="published"
              checked={editPost.published}
              onChange={handleEditPublishedChange}
            />
            <label className="form-check-label" htmlFor="published">
              Publish Post
            </label>
          </div>
          <div>
            <button
              className="btn btn-blog btn-success mb-3"
              onClick={() => {
                formStateRef.current = editPost;
                widgetRef.current.open();
              }}
            >
              <FaEdit className="me-2" />
              Edit Image
            </button>
          </div>
          <button
            className="btn btn-blog-red btn-danger"
            onClick={handleDeletePost}
          >
            <FaTrashAlt /> Delete Post
          </button>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-blog-cancel btn-secondary"
            onClick={() => setShowEditPostModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-blog btn-success"
            onClick={handleUpdatePost}
          >
            Update Post
          </button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showDeleteConfirmModal}
        onHide={() => setShowDeleteConfirmModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this post?</Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-blog-cancel btn-secondary"
            onClick={() => setShowDeleteConfirmModal(false)}
          >
            Cancel
          </button>
          <button
            className="btn btn-blog-red btn-danger"
            onClick={handleConfirmDelete}
          >
            Delete
          </button>
        </Modal.Footer>
      </Modal>

      <div className="table-responsive">
        <table className="table table-striped table-bordered table-hover">
          <thead className="thead-dark">
            <tr>
              <th>ID</th>
              <th>Author</th>
              <th>Title</th>
              <th>Description</th>
              <th>Content</th>
              <th>Created At</th>
              <th>Image</th>
              <th>Published</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {posts.data.map((post) => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>{post.author}</td>
                <td>{post.title}</td>
                <td>{post.description}</td>
                <td>{post.data}</td>
                <td>{post.createdAt}</td>
                <td className="table-image-column">{post.image}</td>
                <td className="text-center">
                  <button
                    className={`btn ${
                      post.published
                        ? "btn-blog-red btn-danger"
                        : "btn-blog-green btn-success"
                    } me-2`}
                    onClick={() => handleTogglePublishStatus(post.id)}
                  >
                    {post.published ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-blog btn-primary me-2"
                    onClick={() => handleEditPost(post)}
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

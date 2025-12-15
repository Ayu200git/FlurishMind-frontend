import React, { Fragment, useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import Layout from "./components/Layout/Layout";
import Backdrop from "./components/Backdrop/Backdrop";
import Toolbar from "./components/Toolbar/Toolbar";
import MainNavigation from "./components/Navigation/MainNavigation/MainNavigation";
import MobileNavigation from "./components/Navigation/MobileNavigation/MobileNavigation";
import ErrorHandler from "./components/ErrorHandler/ErrorHandler";

import FeedPage from "./pages/Feed/Feed";
import SinglePostPage from "./pages/Feed/SinglePost/SinglePost";
import LoginPage from "./pages/Auth/Login";
import SignupPage from "./pages/Auth/Signup";
import ProfilePage from "./pages/Profile/Profile";
import AdminDashboard from "./pages/Admin/AdminDashboard";

import "./App.css";

const App = () => {
  const navigate = useNavigate();
  const [showBackdrop, setShowBackdrop] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiryDate = localStorage.getItem("expiryDate");

    if (!token || !expiryDate) return;

    if (new Date(expiryDate) <= new Date()) {
      logoutHandler();
      return;
    }

    const userId = localStorage.getItem("userId");
    const remainingMilliseconds =
      new Date(expiryDate).getTime() - new Date().getTime();

    setIsAuth(true);
    setToken(token);
    setUserId(userId);

    setAutoLogout(remainingMilliseconds);
  }, []);

  const logoutHandler = useCallback(() => {
    setIsAuth(false);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("expiryDate");
    localStorage.removeItem("userId");
    navigate("/login");
  }, [navigate]);

  const setAutoLogout = (ms) => setTimeout(logoutHandler, ms);

  const loginHandler = async (event, authData) => {
    event.preventDefault();
    setAuthLoading(true);
    setError(null);

    const graphqlQuery = {
      query: `
        query {
          login(email: "${authData.email}", password: "${authData.password}") {
            token
            userId
          }
        }
      `,
    };

    try {
      const res = await fetch("http://localhost:8080/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graphqlQuery),
      });

      if (!res.ok) throw new Error("Failed to reach server!");

      const resData = await res.json();

      if (resData.errors && resData.errors.length > 0) {
        throw new Error(resData.errors[0].message);
      }

      const loginData = resData.data.login;
      if (!loginData) throw new Error("Login failed.");

      const { token, userId } = loginData;

      setIsAuth(true);
      setToken(token);
      setUserId(userId);

      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      const remainingMilliseconds = 60 * 60 * 1000; // 1 hour
      const expiryDate = new Date(new Date().getTime() + remainingMilliseconds);
      localStorage.setItem("expiryDate", expiryDate.toISOString());

      setAutoLogout(remainingMilliseconds);
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setAuthLoading(false);
    }
  };

  const signupHandler = async (event, authData) => {
    event.preventDefault();
    setAuthLoading(true);
    setError(null);

    const graphqlQuery = {
      query: `
        mutation {
          createUser(userInput: {
            email: "${authData.email}",
            name: "${authData.name}",
            password: "${authData.password}"
          }) {
            _id
            email
            name
          }
        }
      `,
    };

    try {
      const res = await fetch("http://localhost:8080/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(graphqlQuery),
      });

      if (!res.ok) throw new Error("Failed to reach server!");

      const resData = await res.json();

      if (resData.errors && resData.errors.length > 0)
        throw new Error(resData.errors[0].message);

      navigate("/login");
    } catch (err) {
      setError(err.message || "Something went wrong!");
    } finally {
      setAuthLoading(false);
    }
  };

  const mobileNavHandler = (isOpen) => {
    setShowMobileNav(isOpen);
    setShowBackdrop(isOpen);
  };

  const backdropClickHandler = () => {
    setShowBackdrop(false);
    setShowMobileNav(false);
    setError(null);
  };

  const errorHandler = () => setError(null);

  const newPostHandlerRef = useRef(() => {});
  const editHandlerRef = useRef(() => {});

  const handleNewPost = useCallback(() => {
    newPostHandlerRef.current();
  }, []);

  const handleEdit = useCallback(() => {
    editHandlerRef.current();
  }, []);

  const adminHandler = () => {
  navigate("/admin");
  };

  const authRoutes = (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage onLogin={loginHandler} loading={authLoading} />}
      />
      <Route
        path="/signup"
        element={<SignupPage onSignup={signupHandler} loading={authLoading} />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>

    
  );

  const protectedRoutes = (
    <Routes>
      <Route
        path="/"
        element={
          <FeedPage
            userId={userId}
            token={token}
            onNewPostRef={newPostHandlerRef}
            onEditRef={editHandlerRef}
          />
        }
      />

      <Route
        path="/post/:postId"
        element={<SinglePostPage userId={userId} token={token} />}
      />

      <Route
        path="/profile/:userId?"
        element={<ProfilePage token={token} currentUserId={userId} />}
      />

       <Route
        path="/admin"
        element={<AdminDashboard token={token} currentUserId={userId} />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

  );

  return (
    <Fragment>
      {showBackdrop && <Backdrop onClick={backdropClickHandler} />}
      <ErrorHandler error={error} onHandle={errorHandler} />

      <Layout
        header={
          <Toolbar>
            <MainNavigation
              onOpenMobileNav={() => mobileNavHandler(true)}
              onLogout={logoutHandler}
              isAuth={isAuth}
              onNewPost={handleNewPost}
              onEdit={handleEdit}
              onAdmin={adminHandler}
              userId={userId}
              token={token}
            />
          </Toolbar>
        }
        mobileNav={
          <MobileNavigation
            open={showMobileNav}
            mobile
            onChooseItem={() => mobileNavHandler(false)}
            onLogout={logoutHandler}
            isAuth={isAuth}
            onNewPost={handleNewPost}
            onEdit={handleEdit}
            onAdmin={adminHandler}
          />
        }
      />

      {isAuth ? protectedRoutes : authRoutes}
    </Fragment>
  );
};

export default App;

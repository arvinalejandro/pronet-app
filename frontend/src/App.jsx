import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import NotificationsPage from './pages/NotificationsPage';
import NetworkPage from './pages/NetworkPage';
import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import PostPage from './pages/PostPage';
import ProfilePage from './pages/ProfilePage';

import toast, { Toaster } from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from './lib/axios';

const App = () => {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/auth/me');
        return res.data;
      } catch (err) {
        if (err.response && err.response.status === 401) {
          return null;
        }
        toast.error(err.response.data.message || 'Something went wrong');
      }
    },
  });
  //console.log('meron', authUser);
  if (isLoading) return null;
  return (
    <div data-theme='light'>
      <Layout>
        <Routes>
          <Route path='/' element={authUser ? <HomePage /> : <Navigate to={'/login'} />} />
          <Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to={'/'} />} />
          <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to={'/'} />} />
          <Route
            path='/notifications'
            element={authUser ? <NotificationsPage /> : <Navigate to={'/login'} />}
          />
          <Route
            path='/network'
            element={authUser ? <NetworkPage /> : <Navigate to={'/login'} />}
          />
          <Route
            path='/post/:postId'
            element={authUser ? <PostPage /> : <Navigate to={'/login'} />}
          />
          <Route
            path='/profile/:username'
            element={authUser ? <ProfilePage /> : <Navigate to={'/login'} />}
          />
        </Routes>
        <Toaster />
      </Layout>
    </div>
  );
};

export default App;

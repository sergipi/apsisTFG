import api from './api';
import type { User } from '../types';

export const login = async (
  username: string,
  password: string
): Promise<User> => {
  const response = await api.post('auth/login/', {
    username,
    password
  });

  const { access, refresh } = response.data;

  localStorage.setItem('apsis_token', access);
  localStorage.setItem('apsis_refresh', refresh);

  const userResponse = await api.get('me/');

  return userResponse.data;
};

export const logout = () => {
  localStorage.removeItem('apsis_token');
  localStorage.removeItem('apsis_refresh');
  localStorage.removeItem('apsis_user');
};


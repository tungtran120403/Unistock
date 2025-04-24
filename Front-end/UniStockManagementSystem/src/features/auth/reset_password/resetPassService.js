// src/services/authService.js
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;
// Thay URL & cổng theo BE của bạn

export async function forgotPassword(email) {
  // Gọi /forgot-password, body: { toEmail: email }
  const response = await axios.post(`${API_URL}/forgot-password`, {
    toEmail: email
  });
  return response.data; // Trả về nội dung response
}

export async function verifyOtp(email, otp) {
  // Gọi /verify-otp, body: { email, otp }
  const response = await axios.post(`${API_URL}/verify-otp`, {
    email,
    otp
  });
  return response.data;
}

export async function resetPassword(email, ephemeralToken, newPassword) {
  // Gọi /reset-password, body: { email, ephemeralToken, newPassword }
  const response = await axios.post(`${API_URL}/reset-password`, {
    email,
    ephemeralToken,
    newPassword
  });
  return response.data;
}

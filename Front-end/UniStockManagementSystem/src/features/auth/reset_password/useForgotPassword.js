// src/hooks/useForgotPassword.js
import { useState } from 'react';
import { forgotPassword, resetPassword, verifyOtp } from './resetPassService';

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleForgotPassword(email) {
    try {
      setLoading(true);
      setError(null);
      const result = await forgotPassword(email);
      return result; // "OTP sent successfully..."
    } catch (err) {
      setError(err.response?.data || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(email, otp) {
    try {
      setLoading(true);
      setError(null);
      const result = await verifyOtp(email, otp);
      return result; // Có thể là "OTP is valid!" hoặc { ephemeralToken: "xxx" } tuỳ BE
    } catch (err) {
      setError(err.response?.data || 'OTP không chính xác hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(email, token, newPassword) {
    try {
      setLoading(true);
      setError(null);
      const result = await resetPassword(email, token, newPassword);
      return result;
    } catch (err) {
      setError(err.response?.data || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    handleForgotPassword,
    handleVerifyOtp,
    handleResetPassword
  };
}

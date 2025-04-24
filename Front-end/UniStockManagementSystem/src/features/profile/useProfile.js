// useProfile.js
import { useState, useEffect } from 'react';
import { getProfile, updateProfile, changePassword, uploadAvatar } from './ProfileService';

const useProfile = () => {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: [],
    avatar: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State cho form đổi mật khẩu
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorCurrentPassword, setErrorCurrentPassword] = useState("");
  const [errorNewPassword, setErrorNewPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");

  // Hàm reset form
  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrorCurrentPassword("");
    setErrorNewPassword("");
    setErrorConfirmPassword("");
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getProfile();
      setProfile({
        fullName: data.fullname || '',
        email: data.email || '',
        phone: data.phoneNumber || '',
        role: data.roles ? Array.from(data.roles).join(', ') : '',
        avatar: data.profilePicture || '',
      });
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi lấy thông tin profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile();
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        fullname: profile.fullName.trim(),
        email: profile.email.trim(),
        phoneNumber: profile.phone.trim(),
      });
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      await changePassword({
        currentPassword,
        newPassword,
      });
      setError(null);
      resetPasswordForm(); // Reset form khi thành công
      setOpenChangePassword(false); // Đóng modal khi thành công
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Lỗi khi đổi mật khẩu';
      console.log("Error in handleChangePassword:", errorMsg);
      setError(errorMsg);
      if (errorMsg.includes("Mật khẩu hiện tại không chính xác")) {
        setErrorCurrentPassword(errorMsg);
      } else {
        setErrorConfirmPassword(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    setLoading(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      setProfile((prev) => ({ ...prev, avatar: avatarUrl || '' }));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi upload ảnh đại diện');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return {
    profile,
    isEditing,
    openChangePassword,
    loading,
    error,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    errorCurrentPassword,
    setErrorCurrentPassword,
    errorNewPassword,
    setErrorNewPassword,
    errorConfirmPassword,
    setErrorConfirmPassword,
    resetPasswordForm,
    handleEdit,
    handleCancel,
    handleSave,
    handleChangePassword,
    handleAvatarUpload,
    handleInputChange,
    setOpenChangePassword,
  };
};

export default useProfile;
import React, { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { Typography } from "@material-tailwind/react";
import { useForgotPassword } from './useForgotPassword'; // Import hook
import { useLocation, useNavigate } from "react-router-dom";

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { handleResetPassword, loading, error: hookError } = useForgotPassword();
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy thông tin email và ephemeralToken từ state được truyền qua navigate
    const { email, ephemeralToken } = location.state || {};

    useEffect(() => {
        document.body.style.backgroundImage = 'url(/img/bg.svg)';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundPosition = 'center';

        return () => {
            document.body.style.backgroundImage = null;
            document.body.style.backgroundSize = null;
            document.body.style.backgroundPosition = null;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu không trùng khớp!');
            return;
        }

        // Kiểm tra mật khẩu phải có ít nhất 8 ký tự, bao gồm cả số và chữ
        const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!regex.test(newPassword)) {
            setError('Mật khẩu phải có ít nhất 8 ký tự, gồm cả số và chữ!');
            return;
        }

        // Kiểm tra email và ephemeralToken có tồn tại không
        if (!email || !ephemeralToken) {
            setError("Thông tin xác thực không hợp lệ. Vui lòng thực hiện lại quy trình quên mật khẩu.");
            return;
        }

        setError('');
        try {
            const result = await handleResetPassword(email, ephemeralToken, newPassword);
            console.log('Kết quả reset mật khẩu:', result);
            // Sau khi thành công, chuyển hướng người dùng (ví dụ: đến trang đăng nhập)
            navigate("/login");
        } catch (err) {
            console.error('Lỗi khi reset mật khẩu:', err);
            setError('Có lỗi xảy ra khi đặt lại mật khẩu.');
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-cover bg-center">
            <div className="flex items-center justify-center gap-20 w-[1200px] py-20 bg-white shadow-blue-gray-900 shadow-[0_0_40px_rgba(0,0,0,0.2)]">
                <Box className="flex flex-col items-center justify-center p-8 rounded-xl max-w-md h-[500px] w-full bg-[#0ab067]/10">
                    <div className='pb-8 flex flex-col items-center justify-center'>
                        <Typography variant="h2" className="font-bold text-center ">
                            Đặt lại mật khẩu
                        </Typography>
                        <Typography className='text-sm text-blue-gray-500'>
                            Hãy nhập mật khẩu mới của bạn
                        </Typography>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 w-full px-5">
                        <div>
                            <Typography>Mật khẩu mới</Typography>
                            <TextField
                                fullWidth
                                hiddenLabel
                                size="small"
                                color="success"
                                variant="outlined"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Typography>Nhập lại mật khẩu</Typography>
                            <TextField
                                fullWidth
                                hiddenLabel
                                size="small"
                                color="success"
                                variant="outlined"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                error={Boolean(error || hookError)}
                                helperText={error || hookError}
                                required
                            />
                        </div>
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                            disabled={loading}
                        >
                            GỬI
                        </Button>
                    </form>
                </Box>
                <div className="w-2/5 h-full hidden lg:block">
                    <img
                        src="/img/logo.svg"
                        className="h-full w-full object-cover rounded-3xl"
                        alt="Logo"
                    />
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
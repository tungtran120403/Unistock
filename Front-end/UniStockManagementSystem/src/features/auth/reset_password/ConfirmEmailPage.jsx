import React, { useState, useEffect } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { Typography } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { useForgotPassword } from './useForgotPassword';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const { handleForgotPassword, loading, error } = useForgotPassword(); 
    const navigate = useNavigate();

    useEffect(() => {
        document.body.style.backgroundImage = 'url(/img/bg.svg)';
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundRepeat = 'none';
        document.body.style.backgroundPosition = 'center';

        return () => {
            document.body.style.backgroundImage = null;
            document.body.style.backgroundSize = null;
            document.body.style.backgroundPosition = null;
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Xoá thông báo cũ (nếu có)
        try {
            // Gọi hàm hook để gửi yêu cầu quên mật khẩu
            const result = await handleForgotPassword(email);
            // Nếu BE trả về thông báo thành công, bạn có thể hiển thị hoặc chuyển trang
            if (result) {
                setMessage("Đã gửi OTP tới email, vui lòng kiểm tra!");
                // Hoặc điều hướng sang trang nhập OTP, ví dụ:
                navigate("/confirmOTP", { state: { email } });
            }
        } catch (err) {
            // Lỗi đã được hook gán vào biến error, 
            // ở đây nếu muốn xử lý thêm, bạn có thể làm
            console.error("Forgot password error:", err);
        }
    };

    return (
        <div className="w-full h-screen flex items-center justify-center bg-cover bg-center">
            <div className="flex items-center justify-center gap-20 w-[1200px] py-20 bg-white shadow-blue-gray-900 shadow-[0_0_40px_rgba(0,0,0,0.2)]">
                <Box className="flex flex-col items-center justify-center p-8 rounded-xl max-w-md h-[500px] w-full bg-[#0ab067]/10">
                    <div className="pb-8">
                        <Typography variant="h2" className="font-bold text-center">
                            Quên mật khẩu
                        </Typography>
                        <Typography className="text-sm text-blue-gray-500">
                            Hãy nhập email đăng ký của bạn để đặt lại mật khẩu
                        </Typography>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 w-full px-5">
                        <div>
                            <Typography>Email</Typography>
                            <TextField
                                fullWidth
                                size="small"
                                color="success"
                                variant="outlined"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Hiển thị lỗi từ hook */}
                        {error && (
                            <Typography color="red" className="text-red-500">
                                {typeof error === "string" ? error : JSON.stringify(error)}
                            </Typography>
                        )}

                        {/* Hiển thị thông báo khi gửi thành công */}
                        {message && (
                            <Typography color="green" className="text-green-500">
                                {message}
                            </Typography>
                        )}

                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={loading}
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? "Đang xử lý..." : "Gửi yêu cầu"}
                        </Button>
                    </form>
                </Box>
                <div className="w-2/5 h-full hidden lg:block">
                    <img
                        src="/img/logo.svg"
                        className="h-full w-full object-cover rounded-3xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
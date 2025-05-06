import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@material-tailwind/react";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-9xl font-bold text-red-600">403!</h1>
      <p className="text-xl text-gray-600 mt-4">Bạn không có quyền truy cập vào trang này.</p>
      {isAuthenticated ? (
        <Button
          size="lg"
          className="bg-[#0ab067] hover:bg-[#089456]/90 hover:shadow-none shadow-none text-white font-medium mt-6 px-6 py-2 rounded-[4px] transition-all duration-200 ease-in-out flex items-center gap-2"
          onClick={() => navigate(-2)}
        >
          Quay lại trang trước
        </Button>

      ) : (
        <Button
          className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => navigate("/")}
        >
          Quay lại Trang chủ
        </Button>
      )}
    </div>
  );
};

export default UnauthorizedPage;

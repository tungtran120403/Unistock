import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem("token"); 

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-6xl font-bold text-yellow-500">403</h1>
      <p className="text-xl text-gray-600 mt-4">Bạn không có quyền truy cập vào trang này.</p>
      {isAuthenticated ? (
        <button
          className="mt-6 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          onClick={() => navigate(-1)}
        >
          Quay lại trang trước
        </button>
      ) : (
        <button
          className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={() => navigate("/")}
        >
          Quay lại Trang chủ
        </button>
      )}
    </div>
  );
};

export default UnauthorizedPage;

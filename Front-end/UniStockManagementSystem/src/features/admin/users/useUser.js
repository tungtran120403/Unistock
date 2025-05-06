import { useState, useEffect } from "react";
import { getUsers, deleteUserById, toggleUserStatus } from "./userService";
import { getUserById as fetchUserById } from "./userService"; // ✅ Đổi tên để tránh đệ quy

const useUser = () => {
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1); // ✅ Thêm state tổng số trang
  const [totalElements, setTotalElements] = useState(0); // ✅ Thêm state tổng số người dùng
  const [loading, setLoading] = useState(false); // ✅ Thêm loading

  // 🟢 **Lấy danh sách Users từ API**
  const fetchPaginatedUsers = async (page = 0, size = 5) => {
    setLoading(true); // ✅ Bắt đầu loading
    try {
      const data = await getUsers(page, size);
      setUsers(data.content || []); // ✅ Đảm bảo dữ liệu là mảng
      setTotalPages(data.totalPages || 1); // ✅ Cập nhật tổng số trang
      setTotalElements(data.totalElements || 0); // ✅ Cập nhật tổng số người dùng
    } catch (error) {
      console.error("❌ Không thể tải danh sách Users:", error);
    } finally {
      setLoading(false); // ✅ Kết thúc loading
    }
  };

  // 🔴 **Xóa user theo ID**
  const deleteUser = async (userId) => {
    try {
      await deleteUserById(userId);
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.userId !== userId)
      ); // ✅ Cập nhật state
    } catch (error) {
      console.error("❌ Lỗi khi xóa User:", error);
    }
  };

  // 🔄 **Toggle trạng thái `isActive`**
  const toggleStatus = async (userId, currentStatus) => {
    try {
      const newStatus = !currentStatus; // ✅ Đảo trạng thái hiện tại
      const updatedUser = await toggleUserStatus(userId, newStatus);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userId === userId
            ? { ...user, isActive: updatedUser.isActive }
            : user
        )
      );
    } catch (error) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", error);
    }
  };

  const getUserById = async (userId) => {
    try {
      const user = await fetchUserById(userId);
      return user;
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông tin User:", error);
    }
  };

  

  // ✅ Gọi `fetchPaginatedUsers` khi Component được mount
  useEffect(() => {
    fetchPaginatedUsers();
  }, []);

  return { users, fetchPaginatedUsers, deleteUser, toggleStatus, totalPages, totalElements, getUserById, loading };
};

export default useUser;

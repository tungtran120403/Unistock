import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL}/admin`;

// ✅ Hàm lấy Token từ LocalStorage với kiểm tra rõ ràng
const authHeader = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("🚨 Không tìm thấy token trong localStorage!");
    return {};
  }

  console.log("🔑 Gửi Token:", token);
  return { Authorization: `Bearer ${token}` };
};

// 🟢 **Thêm Vai Trò mới**
export const addRole = async (newRole) => {
  try {
    console.log("📢 [addRole] Gửi request thêm vai trò:", newRole);
    
    const response = await axios.post(`${API_URL}/roles`, newRole, {
      headers: {
        ...authHeader(), // ✅ Gửi token xác thực
        "Content-Type": "application/json", // ✅ Định dạng dữ liệu gửi đi
      },
    });

    console.log("✅ [addRole] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [addRole] Lỗi khi thêm Vai Trò:", error);
    throw error;
  }
};

// 🟢 **Lấy danh sách Vai Trò**
export const getAllRoles = async () => {
  try {
    console.log("📢 [getAllRoles] Gửi request đến:", `${API_URL}/roles`);
    const response = await axios.get(`${API_URL}/roles`, { headers: authHeader() });

    console.log("✅ [getAllRoles] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [getAllRoles] Lỗi khi lấy danh sách Vai Trò:", error);
    throw error;
  }
};

// 🟢 **Lấy danh sách Permissions**
export const getAllPermissions = async () => {
  try {
    console.log("📢 [getAllPermissions] Gửi request đến:", `${API_URL}/permissions`);
    const response = await axios.get(`${API_URL}/permissions`, { headers: authHeader() });

    console.log("✅ [getAllPermissions] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [getAllPermissions] Lỗi khi lấy danh sách Permissions:", error);
    throw error;
  }
};

// 🟢 **Lấy Permissions của một Role cụ thể**
export const getRolePermissions = async (roleId) => {
  try {
    console.log("📢 [getRolePermissions] Gửi request đến:", `${API_URL}/roles/${roleId}/permissions`);
    const response = await axios.get(`${API_URL}/roles/${roleId}/permissions`, { headers: authHeader() });

    console.log("✅ [getRolePermissions] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ [getRolePermissions] Lỗi khi lấy danh sách Permissions của Role ID ${roleId}:`, error);
    throw error;
  }
};

// 🟢 **Cập nhật Vai Trò**
export const updateRole = async (id, updatedRole) => {
  try {
    console.log("📢 [updateRole] Cập nhật role:", updatedRole);
    const response = await axios.put(`${API_URL}/roles/${id}`, updatedRole, {
      headers: authHeader(),
    });
    console.log("✅ [updateRole] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [updateRole] Lỗi khi cập nhật Vai Trò:", error);
    throw error;
  }
};

// 🔄 **Toggle trạng thái `isActive` của Vai Trò**
export const toggleRoleStatus = async (id, newStatus) => {
  try {
    console.log("📢 [toggleRoleStatus] Cập nhật trạng thái role:", { id, newStatus });
    const response = await axios.patch(
      `${API_URL}/roles/${id}/status`,
      { active: newStatus },
      { headers: authHeader() }
    );
    console.log("✅ [toggleRoleStatus] API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [toggleRoleStatus] Lỗi khi cập nhật trạng thái Vai Trò:", error);
    throw error;
  }
};

// 🔴 **Xóa Vai Trò theo ID**
export const deleteRole = async (id) => {
  try {
    console.log(`📢 [deleteRole] Xóa role ID: ${id}`);
    await axios.delete(`${API_URL}/roles/${id}`, { headers: authHeader() });
    console.log("✅ [deleteRole] Xóa thành công");
  } catch (error) {
    console.error("❌ [deleteRole] Lỗi khi xóa Vai Trò:", error);
    throw error;
  }
};

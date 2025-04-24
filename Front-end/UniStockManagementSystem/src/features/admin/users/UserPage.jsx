import React, { useEffect, useState } from "react";
import useUser from "./useUser";
import {
  Card,
  CardBody,
  Typography,
  Avatar,
  Switch,
  Tooltip,
} from "@material-tailwind/react";
import {
  TextField,
  Divider,
  Button as MuiButton,
  IconButton,
  Autocomplete
} from "@mui/material";
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import ModalAddUser from "./ModalAddUser";
import ModalEditUser from "./ModalEditUser";
import { getUserById } from "./userService";
import ReactPaginate from "react-paginate";
import { ArrowRightIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { BiSolidEdit } from "react-icons/bi";
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import ConfirmDialog from "@/components/ConfirmDialog";
import SuccessAlert from "@/components/SuccessAlert";

const UserPage = () => {
  const {
    users,
    fetchPaginatedUsers,
    toggleStatus,
    totalPages,
    totalElements,
  } = useUser();

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState({ open: false, message: "" });
  const [successAlert, setSuccessAlert] = useState({ open: false, message: "" });
  const [selectedUserToToggle, setSelectedUserToToggle] = useState(null);

  // State quản lý phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // Mỗi lần currentPage hoặc pageSize đổi => fetch lại
  useEffect(() => {
    fetchPaginatedUsers(currentPage, pageSize);
  }, [currentPage, pageSize]);

  // Mở modal sửa và lấy user chi tiết
  const handleEditUser = async (user) => {
    try {
      const userData = await getUserById(user.userId);
      setSelectedUser(userData);
      setOpenEditModal(true);
    } catch (error) {
      console.error("❌ Lỗi khi lấy thông tin user:", error);
      alert("Không thể lấy thông tin user!");
    }
  };

  // Xử lý đổi trang
  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedUserToToggle) return;

    try {
      await toggleStatus(selectedUserToToggle.userId, selectedUserToToggle.isActive);
      setSuccessAlert({
        open: true,
        message: "Cập nhật trạng thái người dùng thành công!",
      });
      fetchPaginatedUsers(currentPage, pageSize);
    } catch (error) {
      console.error("❌ Lỗi khi thay đổi trạng thái:", error);
    } finally {
      setConfirmDialogOpen(false);
      setSelectedUserToToggle(null);
    }
  };

  // Lọc user theo searchTerm
  const filteredUsers = users.filter(
    (user) =>
      (user.username &&
        user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Cấu hình cột cho Table
  const columnsConfig = [
    {
      field: "stt", headerName: "STT", flex: 1, minWidth: 50, editable: false, filterable: false,
      renderCell: (params) => params.row.id
    },
    {
      field: "username",
      headerName: "Người dùng",
      flex: 2,
      minWidth: 400,
      editable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-4 py-3">
          <Avatar
            src={(params.row.userDetail && params.row.userDetail.profilePicture) || "/img/bruce-mars.jpeg"}
            alt={params.row.email}
            size="sm"
            variant="rounded"
          />

          <div>
            <Typography variant="small" color="blue-gray" className="font-semibold">
              {params.row.username}
            </Typography>
            <Typography variant="small" color="gray" className="text-xs">
              {params.row.email}
            </Typography>
          </div>
        </div>
      ),
    },
    {
      field: "roleNames",
      headerName: "Vai trò",
      editable: false,
      filterable: false,
      flex: 1,
      minWidth: 50,
      renderCell: (params) => (
        <Typography className="text-xs font-semibold text-blue-gray-600">
          {Array.isArray(params.row.roleNames)
            ? params.row.roleNames.filter((role) => role !== "USER").join(", ")
            : params.row.roleNames}
        </Typography>
      ),
    },
    {
      field: "isActive",
      headerName: "Trạng thái",
      editable: false,
      filterable: false,
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Switch
            color="green"
            checked={params.row.isActive}
            onChange={() => {
              if (!params.row.roleNames.includes("ADMIN")) {
                setSelectedUserToToggle(params.row);
                setConfirmDialogOpen({
                  open: true,
                  message: params.row.isActive
                    ? "Bạn có chắc chắn muốn ngưng hoạt động người dùng này không?"
                    : "Bạn có chắc chắn muốn kích hoạt người dùng này không?",
                });
              }
            }}
            disabled={params.row.roleNames.includes("ADMIN")}
          />
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                  ${params.row.isActive ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
          >
            {params.row.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
          </div>
        </div>
      ),
    },
    {
      field: "actions",
      headerName: "Hành động",
      editable: false,
      filterable: false,
      flex: 1,
      minWidth: 50,
      renderCell: (params) => (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Tooltip content="Chỉnh sửa">
            <IconButton
              size="small"
              onClick={() => {
                handleEditUser(params.row);
              }}
              color="primary"
            >
              <ModeEditOutlineOutlinedIcon />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  // Chuẩn bị dữ liệu cho bảng
  const tableData = filteredUsers.map((user, index) => ({
    id: currentPage * pageSize + (index + 1),
    ...user,
  }));

  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">

        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Danh sách Người Dùng"
            addButtonLabel="Thêm người dùng"
            onAdd={() => setOpenAddModal(true)}
            showImport={false}
            showExport={false}
          />
          {/* Chọn số items/trang + Tìm kiếm */}
          <div className="py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Typography
                variant="small"
                color="blue-gray"
                className="font-light"
              >
                Hiển thị
              </Typography>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(0);
                }}
                className="border text-sm rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-normal"
              >
                bản ghi mỗi trang
              </Typography>
            </div>
            <TableSearch
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={() => {
                // Thêm hàm xử lý tìm kiếm vào đây nếu có
                console.log("Tìm kiếm người dùng:", searchTerm);
              }}
              placeholder="Tìm kiếm người dùng"
            />

          </div>

          {/* Bảng danh sách user */}
          <Table data={tableData} columnsConfig={columnsConfig} enableSelection={false} />

          {/* PHÂN TRANG */}
          <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-normal">
                Trang {currentPage + 1} / {totalPages} • {totalElements} người dùng
              </Typography>
            </div>
            <ReactPaginate
              previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
              nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
              breakLabel="..."
              pageCount={totalPages}
              marginPagesDisplayed={2}
              pageRangeDisplayed={5}
              onPageChange={handlePageChange}
              containerClassName="flex items-center gap-1"
              pageClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-[#0ab067] hover:text-white"
              pageLinkClassName="flex items-center justify-center w-full h-full"
              previousClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
              nextClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
              breakClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700"
              activeClassName="bg-[#0ab067] text-white border-[#0ab067] hover:bg-[#0ab067]"
              forcePage={currentPage}
              disabledClassName="opacity-50 cursor-not-allowed"
            />
          </div>
        </CardBody>
      </Card>

      {/* Modal Thêm Người Dùng */}
      {openAddModal && (
        <ModalAddUser
          open={openAddModal}
          onClose={() => setOpenAddModal(false)}
          fetchUsers={fetchPaginatedUsers}
          onSuccess={(message) => setSuccessAlert({ open: true, message })}
        />
      )}

      {/* Modal Chỉnh Sửa Người Dùng */}
      {openEditModal && (
        <ModalEditUser
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          user={selectedUser}
          fetchUsers={fetchPaginatedUsers}
          onSuccess={(message) => setSuccessAlert({ open: true, message })}
        />
      )}

      <ConfirmDialog
        open={confirmDialogOpen.open}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmToggleStatus}
        message= {confirmDialogOpen.message}
        confirmText="Có"
        cancelText="Không"
      />

      <SuccessAlert
        open={successAlert.open}
        onClose={() => setSuccessAlert({ open: false, message: "" })}
        message={successAlert.message}
      />
    </div>
  );
};

export default UserPage;

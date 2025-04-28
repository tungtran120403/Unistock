import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { Card, CardBody, Typography, Tooltip } from "@material-tailwind/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@mui/material";
import { VisibilityOutlined } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import TableSearch from '@/components/TableSearch';
import Table from "@/components/Table";
import SuccessAlert from "@/components/SuccessAlert";
import { getIssueNotes } from "./issueNoteService";

const IssueNotePage = () => {
  const [issueNotes, setIssueNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  // Sử dụng 10 bản ghi mỗi trang như ReceiptNotePage
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [showImportPopup, setShowImportPopup] = useState(false);
  const navigate = useNavigate();

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const location = useLocation();

  useEffect(() => {
    if (location.state?.successMessage) {
      console.log("Component mounted, location.state:", location.state?.successMessage);
      setAlertMessage(location.state.successMessage);
      setShowSuccessAlert(true);
      // Xóa state để không hiển thị lại nếu người dùng refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    fetchPaginatedIssueNotes(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const fetchPaginatedIssueNotes = async (page, size, search = "") => {
    try {
      // API trả về dạng: { totalPages, content: [ { ginId, ginCode, description, category, issueDate, soCode, createdByUsername, details, ... } ] }
      const data = await getIssueNotes(page, size);
      setIssueNotes(data.content || []);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (error) {
      console.error("Error fetching issue notes:", error);
    }
  };

  const handlePageChange = (selectedItem) => {
    setCurrentPage(selectedItem.selected);
  };

  const handleAdd = async () => {
    navigate("/user/issueNote/add");
  };

  const handleViewIssue = (row) => {
    // Điều hướng đến trang chi tiết phiếu xuất; sử dụng ginId làm id
    navigate(`/user/issueNote/${row.id}`);
  };

  const handleSearch = () => {
    setCurrentPage(0);
    fetchPaginatedIssueNotes(0, pageSize, searchTerm);
  };

  // Lọc dữ liệu theo từ khóa dựa trên ginCode hoặc description
  const filteredIssueNotes = issueNotes.filter(
    (note) =>
      (note.ginCode ? note.ginCode.toLowerCase() : "").includes(searchTerm.toLowerCase()) ||
      (note.description ? note.description.toLowerCase() : "").includes(searchTerm.toLowerCase())
  );

  // Map dữ liệu cho bảng; nếu không có ginId, tạo id dự phòng
  const data = filteredIssueNotes.map((note, index) => ({
    id: note.ginId ? note.ginId : `${currentPage}-${index}`,
    index: currentPage * pageSize + index + 1,
    ginCode: note.ginCode || "N/A",
    category: note.category || "N/A",
    description: note.description || "Không có ghi chú",
    issueDate: note.issueDate,
    createdByUserName: note.createdByUserName ,
    soId: note.soId, 
    soCode: note.soCode || "-"
  }));

  // Cấu hình các cột hiển thị; thay createdBy và soId bằng createdByUsername và soCode
  const columnsConfig = [
  	{ field: 'index', headerName: 'STT', flex: 0.5, minWidth: 50, editable: false, filterable: false },
    { field: 'ginCode', headerName: 'Mã phiếu xuất', flex: 1.5, minWidth: 150 },
    { field: 'category', headerName: 'Phân loại xuất kho', flex: 2, minWidth: 100 },
    
    {
      field: 'issueDate',
      headerName: 'Ngày lập phiếu',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        if (!params.value) return "Không có dữ liệu";
        return new Date(params.value).toLocaleDateString("vi-VN");
      },
    },
    {
      field: 'createdByUserName',
      headerName: 'Người tạo phiếu',
      flex: 1.5,
      minWidth: 100,
      editable: false,
      filterable: false,
      renderCell: (params) => params.value,
    },
    {
      field: 'soCode',
      headerName: 'Tham chiếu',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
      renderCell: (params) => {
        const soCode = params.value;
        if (soCode && soCode !== "Không có") {
          return (
            <span
              onClick={() => navigate(`/user/sale-orders/${params.row.soId}`)}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              {soCode}
            </span>
          );
        }
        return "Không có";
      },
    },

    {
      field: 'actions',
      headerName: 'Hành động',
      flex: 0.5,
      minWidth: 100,
      editable: false,
      filterable: false,
      renderCell: (params) => (
        <div className="flex justify-center w-full">
          <Tooltip content="Xem chi tiết">

            <IconButton
              size="small"
              color="primary"
              onClick={() => handleViewIssue(params.row)}
            >
              <VisibilityOutlined />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="mb-8 flex flex-col gap-8" style={{ height: 'calc(100vh - 100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title="Danh sách phiếu xuất kho"
            addButtonLabel="Thêm phiếu xuất"
            onAdd={handleAdd}
            showImport={false}
            showExport={false}
          />
          <div className="py-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-light">
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
              <Typography variant="small" color="blue-gray" className="font-normal">
                bản ghi mỗi trang
              </Typography>
            </div>
            <TableSearch
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearch}
              placeholder="Tìm kiếm phiếu xuất"
            />
          </div>
          <div className="w-full overflow-x-auto">
            <Table data={data} columnsConfig={columnsConfig} enableSelection={false} />
          </div>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Typography variant="small" color="blue-gray" className="font-normal">
                Trang {currentPage + 1} / {totalPages || 1} • {totalElements || 0} bản ghi
              </Typography>
            </div>
            <ReactPaginate
              previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
              nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
              breakLabel="..."
              pageCount={totalPages || 1}
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

      <SuccessAlert
        open={showSuccessAlert}
        onClose={() => setShowSuccessAlert(false)}
        message={alertMessage}
      />
    </div>
  );
};

export default IssueNotePage;

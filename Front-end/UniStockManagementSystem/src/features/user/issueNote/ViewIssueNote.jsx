import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { TextField, Button as MuiButton, Divider } from "@mui/material";
import PageHeader from "@/components/PageHeader";
import FilePreviewDialog from "@/components/FilePreviewDialog";
import useIssueNote from "./useIssueNote";
import robotoFont from '@/assets/fonts/Roboto-Regular-normal.js';
import robotoBoldFont from '@/assets/fonts/Roboto-Regular-bold.js';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import Table from "@/components/Table";
import ReactPaginate from "react-paginate";
import { ArrowLeftIcon, ArrowRightIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { FaArrowLeft } from "react-icons/fa";

const formatDate = (dateStr) => dayjs(dateStr).format("DD/MM/YYYY");

const ViewIssueNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchIssueNoteDetail } = useIssueNote();

  const [data, setData] = useState(null);
  const [creator, setCreator] = useState("Đang tải...");
  const [loading, setLoading] = useState(true);
  const [soReference, setSoReference] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [previewFile, setPreviewFile] = useState(null);

  const handlePreview = (file) => setPreviewFile(file);
  const handleClosePreview = () => setPreviewFile(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const issueNote = await fetchIssueNoteDetail(id);
        setData(issueNote);
        setCreator(issueNote.createdByUserName || "Không xác định");
        if (issueNote.soId && issueNote.category === "Bán hàng") {
          setSoReference(`SO${issueNote.soCode}`);
        }
      } catch (err) {
        console.error("Lỗi khi tải phiếu xuất:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, fetchIssueNoteDetail]);

  if (loading) return <Typography>Đang tải dữ liệu...</Typography>;
  if (!data) return <Typography className="text-red-500">Không tìm thấy phiếu xuất</Typography>;

  const totalItems = data.details ? data.details.length : 0;
  const totalPagesDetails = Math.ceil(totalItems / pageSize);
  const displayedItems = data.details ? data.details.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : [];
  const displayedItemsWithIndex = displayedItems.map((item, idx) => ({
    ...item,
    index: currentPage * pageSize + idx,
    id: item.ginDetailsId ? item.ginDetailsId : currentPage * pageSize + idx,
  }));

  const getColumnsConfig = (category) => {
    const isSales = category === "Bán hàng";
    return [
      {
        field: "index",
        headerName: "STT",
        minWidth: 50,
        flex: 0.5,
        filterable: false,
        editable: false,
        renderCell: (params) => <div className="text-center">{params.row.index + 1}</div>,
      },
      {
        field: "code",
        headerName: isSales ? "Mã hàng" : "Mã SP/NVL",
        minWidth: 100,
        flex: 1,
        filterable: false,
        editable: false,
        renderCell: (params) => (
          <div className="text-center">
            {params.row.materialCode || params.row.productCode || ""}
          </div>
        ),
      },
      {
        field: "name",
        headerName: isSales ? "Tên hàng" : "Tên SP/NVL",
        minWidth: 150,
        flex: 2,
        filterable: false,
        editable: false,
        renderCell: (params) => (
          <div className="text-center">
            {params.row.materialName || params.row.productName || ""}
          </div>
        ),
      },
      {
        field: "quantity",
        headerName: "Số lượng",
        minWidth: 80,
        flex: 1,
        filterable: false,
        editable: false,
        renderCell: (params) => (
          <div className="text-center">
            {!isNaN(params.row.quantity) ? params.row.quantity : ""}
          </div>
        ),
      },
      {
        field: "warehouse",
        headerName: "Xuất kho",
        minWidth: 150,
        flex: 2,
        filterable: false,
        editable: false,
        renderCell: (params) => (
          <div className="text-center">
            {params.row.warehouseCode && params.row.warehouseName
              ? `${params.row.warehouseCode} - ${params.row.warehouseName}`
              : ""}
          </div>
        ),
      },
    ];
  };

  const columnsConfig = getColumnsConfig(data.category);

  const handleExportPDF = () => {
    const formatVietnameseDate = (dateString) => {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `Ngày ${day} tháng ${month} năm ${year}`;
    };
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.addFileToVFS("Roboto-Bold.ttf", robotoBoldFont);
    doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");
    doc.addFileToVFS("Roboto-Regular.ttf", robotoFont);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

    doc.setFont("Roboto", "bold");
    doc.setFontSize(14);
    doc.text("CÔNG TY TNHH THIÊN NGỌC AN", 14, 20);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    doc.text("Đ/C: TL 419 KCN Phùng Xá, Huyện Thạch Thất, TP. Hà Nội", 14, 26);
    doc.text("SĐT: 0909.009.990", 14, 32);
    doc.setFont("Roboto", "bold");
    doc.text("Số phiếu: ", 160, 26);
    doc.setFont("Roboto", "normal");
    doc.text(`${data.ginCode}`, 176, 26);

    doc.setFont("Roboto", "bold");
    doc.setFontSize(20);
    doc.text("PHIẾU XUẤT KHO", 80, 40);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(9);
    doc.text(formatVietnameseDate(data.issueDate), 110, 45, { align: "center" });

    doc.setFont("Roboto", "normal");
    doc.setFontSize(10);
    let currentY = 54;
    doc.text(`Người lập phiếu: ${creator}`, 14, currentY);
    if (data.category === "Bán hàng" && data.soCode) {
      doc.text(`Căn cứ theo đơn hàng: ${data.soCode}`, 140, currentY);
      currentY += 6;
    }
    doc.text(`Phân loại xuất kho: ${data.category}`, 14, currentY);
    currentY += 6;
    if (data.category === "Sản xuất" && data.receiver) {
      doc.text(`Người nhận: ${data.receiver}`, 14, currentY);
      currentY += 6;
    }
    if (["Gia công", "Trả lại hàng mua"].includes(data.category) && data.partnerName) {
      doc.text(`Đối tác: ${data.partnerName} (${data.partnerCode})`, 14, currentY);
      currentY += 6;
      if (data.contactName) {
        doc.text(`Người liên hệ: ${data.contactName}`, 14, currentY);
        currentY += 6;
      }
      if (data.address) {
        doc.text(`Địa chỉ: ${data.address}`, 14, currentY);
        currentY += 6;
      }
    }
    const descriptionText = `Diễn giải: ${data.description || "Không có"}`;
    const splitDescription = doc.splitTextToSize(descriptionText, 180);
    doc.text(splitDescription, 14, currentY);
    const descriptionHeight = splitDescription.length * 5;
    currentY += descriptionHeight;

    const totalQuantity = data.details.reduce((sum, item) => sum + (item.quantity || 0), 0);

    const tableHeaders = [
      { content: "STT", styles: { halign: 'center', cellWidth: 12 } },
      { content: data.category === "Bán hàng" ? "Mã hàng" : "Mã SP/NVL", styles: { halign: 'center', cellWidth: 35 } },
      { content: data.category === "Bán hàng" ? "Tên hàng" : "Tên SP/NVL", styles: { halign: 'center', cellWidth: 70 } },
      { content: "Số lượng", styles: { halign: 'center', cellWidth: 20 } },
      { content: "Kho xuất", styles: { halign: 'center', cellWidth: 45 } },
    ];

    const tableBody = [
      ...data.details.map((item, index) => [
        { content: index + 1, styles: { halign: 'center' } },
        { content: item.materialCode || item.productCode || "", styles: { halign: 'left' } },
        { content: item.materialName || item.productName || "", styles: { halign: 'left' } },
        { content: item.quantity, styles: { halign: 'center' } },
        { content: item.warehouseName || "", styles: { halign: 'center' } },
      ]),
      [
        { content: "TỔNG CỘNG :", colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
        { content: totalQuantity, styles: { halign: 'center', fontStyle: 'bold' } },
        { content: "", styles: { halign: 'center' } },
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [tableHeaders],
      body: tableBody,
      styles: {
        font: "Roboto",
        fontSize: 10,
        cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
        valign: 'middle',
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 20,
        fontSize: 10,
        lineWidth: 0.2,
        cellPadding: { top: 3, bottom: 3 },
      },
      bodyStyles: {
        textColor: 20,
        lineWidth: 0.2,
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      tableLineWidth: 0.2,
      tableLineColor: 200,
      margin: { top: 0, left: 14, right: 14 },
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFont("Roboto", "bold");
    doc.setFontSize(10);
    doc.text("Người giao hàng", 20, finalY);
    doc.text("Nhân viên kho xuất hàng", 90, finalY);
    doc.text("Thủ kho", 175, finalY);
    doc.setFont("Roboto", "normal");
    doc.setFontSize(8);
    doc.text("(Ký, họ tên)", 32, finalY + 5, { align: "center" });
    doc.text("(Ký, họ tên)", 110, finalY + 5, { align: "center" });
    doc.text("(Ký, họ tên)", 182, finalY + 5, { align: "center" });

    doc.save(`PhieuXuat_${data.ginCode}.pdf`);
  };

  const handleExportExcel = () => {
    const sheetData = [
      ["Mã phiếu xuất", data.ginCode],
      ["Ngày tạo", formatDate(data.issueDate)],
      ["Người tạo", creator],
      ["Loại hàng hóa", data.category],
      ...(data.category === "Bán hàng" && data.soCode ? [["Tham chiếu chứng từ", data.soCode]] : []),
      ...(data.category === "Sản xuất" && data.receiver ? [["Người nhận", data.receiver]] : []),
      ...(data.partnerName ? [
        ["Đối tác", `${data.partnerName} (${data.partnerCode})`],
        ...(data.contactName ? [["Người liên hệ", data.contactName]] : []),
        ...(data.address ? [["Địa chỉ", data.address]] : []),
      ] : []),
      ["Diễn giải", data.description || "Không có"],
      [],
    ];

    const headers = [
      "STT",
      data.category === "Bán hàng" ? "Mã hàng" : "Mã SP/NVL",
      data.category === "Bán hàng" ? "Tên hàng" : "Tên SP/NVL",
      "Số lượng",
      "Xuất kho",
    ];

    sheetData.push(headers);

    const body = data.details.map((item, index) => [
      index + 1,
      item.materialCode || item.productCode || "",
      item.materialName || item.productName || "",
      item.quantity,
      item.warehouseName || "",
    ]);

    sheetData.push(...body);

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PhieuXuat");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([excelBuffer]), `PhieuXuat_${data.ginCode}.xlsx`);
  };

  return (
    <div className="mb-8 flex flex-col gap-12">
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title={`Chi tiết phiếu xuất ${data.ginCode}`}
            showAdd={false}
            showImport={false}
            showExport={true}
            onExport={handleExportPDF}
            extraActions={
              <Button
                size="sm"
                color="blue"
                variant="outlined"
                onClick={handleExportExcel}
              >
                Xuất Excel
              </Button>
            }
          />
          <Typography variant="h6" className="flex items-center mb-4 text-black">
            <InformationCircleIcon className="h-5 w-5 mr-2" />
            Thông tin chung
          </Typography>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Mã phiếu xuất
              </Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                disabled
                value={data.ginCode}
                sx={{
                  "& .MuiInputBase-root.Mui-disabled": {
                    bgcolor: "#eeeeee",
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Phân loại hàng xuất
              </Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                disabled
                value={data.category}
                sx={{
                  "& .MuiInputBase-root.Mui-disabled": {
                    bgcolor: "#eeeeee",
                    "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Ngày tạo phiếu
              </Typography>
              <style>
                {`.MuiPickersCalendarHeader-label { text-transform: capitalize !important; }`}
              </style>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                <DatePicker
                  value={data.issueDate ? dayjs(data.issueDate) : null}
                  disabled
                  format="DD/MM/YYYY"
                  dayOfWeekFormatter={(weekday) => `${weekday.format("dd")}`}
                  slotProps={{
                    textField: {
                      hiddenLabel: true,
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    },
                  }}
                />
              </LocalizationProvider>
            </div>
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Người tạo phiếu
              </Typography>
              <TextField
                fullWidth
                size="small"
                color="success"
                variant="outlined"
                disabled
                value={creator}
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  },
                }}
              />
            </div>
            {data.category === "Bán hàng" && (
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Tham chiếu chứng từ
                </Typography>
                {data.soId ? (
                  <Link
                    to={`/user/sale-orders/${data.soId}`}
                    className="text-blue-600 hover:underline text-sm block mt-1"
                  >
                    {`${data.soCode}`}
                  </Link>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value="Không có"
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      },
                    }}
                  />
                )}
              </div>
            )}
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                File đính kèm
              </Typography>
              {data.paperEvidence && data.paperEvidence.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {data.paperEvidence.map((url, index) => (
                    <MuiButton
                      key={index}
                      variant="outlined"
                      color="primary"
                      disableElevation
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'start',
                        padding: 0,
                      }}
                      className="text-xs w-full gap-2"
                    >
                      <span
                        className="truncate max-w-[100%] px-2 py-1"
                        onClick={() => handlePreview(url)}
                      >
                        {url.split("/").pop()}
                      </span>
                    </MuiButton>
                  ))}
                </div>
              ) : (
                <Typography variant="small" className="text-gray-600">
                  Không có
                </Typography>
              )}
              <FilePreviewDialog
                file={previewFile}
                open={!!previewFile}
                onClose={handleClosePreview}
                showDownload={true}
              />
            </div>
            {data.category === "Sản xuất" && data.receiver && (
              <div>
                <Typography variant="medium" className="mb-1 text-black">
                  Người nhận
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  color="success"
                  variant="outlined"
                  disabled
                  value={data.receiver}
                  sx={{
                    '& .MuiInputBase-root.Mui-disabled': {
                      bgcolor: '#eeeeee',
                      '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    },
                  }}
                />
              </div>
            )}
            {["Gia công", "Trả lại hàng mua"].includes(data.category) && data.partnerName && (
              <>
                <div>
                  <Typography variant="medium" className="mb-1 text-black">
                    {data.category === "Gia công" ? "Đối tác gia công" : "Nhà cung cấp"}
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={`${data.partnerName}`}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                      },
                    }}
                  />
                </div>
                {data.contactName && (
                  <div>
                    <Typography variant="medium" className="mb-1 text-black">
                      Người liên hệ
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      color="success"
                      variant="outlined"
                      disabled
                      value={data.contactName}
                      sx={{
                        '& .MuiInputBase-root.Mui-disabled': {
                          bgcolor: '#eeeeee',
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        },
                      }}
                    />
                  </div>
                )}
                {data.address && (
                  <div className="col-span-2">
                    <Typography variant="medium" className="mb-1 text-black">
                      Địa chỉ
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      color="success"
                      variant="outlined"
                      disabled
                      value={data.address}
                      sx={{
                        '& .MuiInputBase-root.Mui-disabled': {
                          bgcolor: '#eeeeee',
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        },
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 mb-6">
            <div>
              <Typography variant="medium" className="mb-1 text-black">
                Diễn giải xuất kho
              </Typography>
              <TextField
                fullWidth
                size="small"
                hiddenLabel
                multiline
                rows={4}
                color="success"
                value={data.description || "Không có"}
                disabled
                sx={{
                  '& .MuiInputBase-root.Mui-disabled': {
                    bgcolor: '#eeeeee',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  },
                }}
              />
            </div>
          </div>

          <Typography variant="h6" className="flex items-center mb-4 text-black">
            <ListBulletIcon className="h-5 w-5 mr-2" />
            Danh sách hàng hóa
          </Typography>
          <div className="overflow-auto border rounded">
            <Table
              data={displayedItemsWithIndex}
              columnsConfig={columnsConfig}
              enableSelection={false}
            />
          </div>

          {totalItems > 0 && (
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Typography variant="small" color="blue-gray" className="font-normal">
                  Trang {currentPage + 1} / {totalPagesDetails} • {totalItems} bản ghi
                </Typography>
              </div>
              <ReactPaginate
                previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                breakLabel="..."
                pageCount={totalPagesDetails}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={({ selected }) => setCurrentPage(selected)}
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
          )}
          <Divider />
          <div className="pt-4 pb-3 flex justify-start">
            <MuiButton
              color="info"
              size="medium"
              variant="outlined"
              sx={{
                height: "36px",
                color: "#616161",
                borderColor: "#9e9e9e",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                  borderColor: "#757575",
                },
              }}
              onClick={() => navigate("/user/issueNote")}
              className="flex items-center gap-2"
            >
              <FaArrowLeft className="h-3 w-3" /> Quay lại
            </MuiButton>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default ViewIssueNote;
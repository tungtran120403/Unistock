import { getPurchaseOrderById } from "./purchaseOrderService";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tab,
  Tabs,
  TextField,
  Button,
} from '@mui/material';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Card,
  CardBody,
  Typography,
} from "@material-tailwind/react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Tiếng Việt
import { ListBulletIcon } from "@heroicons/react/24/outline";
import { InformationCircleIcon, IdentificationIcon } from "@heroicons/react/24/solid";
import { FaArrowLeft } from "react-icons/fa";
import PageHeader from '@/components/PageHeader';
import Table from "@/components/Table";

const PurchaseOrderDetail = () => {
  const { orderId } = useParams();
  console.log("📢 orderId từ URL:", orderId); // Debug log

  const navigate = useNavigate();
  const [order, setOrder] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("orderInfo");

  const getStatusLabel = (statusCode) => {
    const statusMap = {
      PENDING: "Chờ nhận",
      IN_PROGRESS: "Đã nhập một phần",
      COMPLETED: "Hoàn thành",
      CANCELED: "Hủy",
    };
    return statusMap[statusCode] || "Không xác định";
  };

  useEffect(() => {
    if (!orderId || order) return; // Nếu đã có dữ liệu, không gọi API

    let isMounted = true;

    const fetchOrderDetail = async () => {
      try {
        console.log("📢 Gọi API lấy đơn hàng với ID:", orderId);
        const response = await getPurchaseOrderById(orderId);
        console.log("✅ Kết quả từ API:", response);

        if (isMounted) {
          setOrder({
            ...response,
            items: response.items || [],
          });
        }
      } catch (error) {
        if (isMounted) setError("Không thể tải dữ liệu đơn hàng.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrderDetail();
    return () => { isMounted = false; };
  }, [orderId]);

  if (loading) return <Typography>Đang tải dữ liệu...</Typography>;
  if (error) return <Typography className="text-red-500">{error}</Typography>;

  const items = order?.details || [];

  const exportToExcelFromTemplate = async () => {
    try {
      const response = await fetch("/templates/MAU_DON_DAT_HANG.xlsx"); // File đặt trong public/templates
      const arrayBuffer = await response.arrayBuffer();
      const formatVietnameseDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // ✅ thêm 0 nếu cần
        const year = date.getFullYear();
        return `Ngày ${day} tháng ${month} năm ${year}`;
      };
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);
      const sheet = workbook.getWorksheet(3); // Sheet

      // --- Ghi thông tin đơn hàng ---
      sheet.getCell("B7").value = order.poCode || "";
      sheet.getCell("B6").value = formatVietnameseDate(order.orderDate);
      sheet.getCell("B9").value = order.supplierName || "";
      sheet.getCell("B11").value = order.supplierContactName || "";
      sheet.getCell("B12").value = order.supplierPhone || "";
      sheet.getCell("B10").value = order.supplierAddress || "";

      const templateRow = sheet.getRow(21);
      const startRow = 21;
      const items = order.details;

      // ⚠️ Chèn số dòng trống bên dưới dòng template (tránh đè dòng thanh toán & chữ ký)
      if (items.length > 1) {
        sheet.spliceRows(startRow + 1, 0, ...Array(items.length - 1).fill([]));
      }

      items.forEach((item, index) => {
        const targetRow = sheet.getRow(startRow + index);

        // Sao chép định dạng từ dòng mẫu
        templateRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const targetCell = targetRow.getCell(colNumber);
          targetCell.style = { ...cell.style };
          targetCell.border = cell.border;
          targetCell.alignment = cell.alignment;
          targetCell.font = cell.font;
          targetCell.fill = cell.fill;
        });

        // Ghi dữ liệu
        targetRow.getCell(1).value = index + 1;
        targetRow.getCell(2).value = item.materialName;
        targetRow.getCell(3).value = item.orderedQuantity;
        targetRow.getCell(4).value = item.unit;
        targetRow.commit();
      });



      // --- Xuất file ---
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `DonDatHang_${order.poCode}.xlsx`);
    } catch (err) {
      console.error("Lỗi xuất file:", err);
      alert("Có lỗi xảy ra khi xuất Excel");
    }
  };

  const columnsConfig = [
    {
      field: "stt",
      headerName: "STT",
      flex: 0.5,
      minWidth: 50,
      editable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "materialCode",
      headerName: "Mã hàng",
      flex: 1.5,
      minWidth: 150,
      editable: false,
      filterable: false,
    },
    {
      field: "materialName",
      headerName: "Tên hàng",
      flex: 2,
      minWidth: 250,
      editable: false,
      filterable: false,
    },
    {
      field: "orderedQuantity",
      headerName: "Số lượng",
      flex: 1,
      minWidth: 100,
      editable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "unit",
      headerName: "Đơn vị",
      flex: 1,
      minWidth: 100,
      editable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
    },
  ];

  const data = items.map((item, index) => ({
    ...item,
    stt: index + 1,
  }));


  return (
    <div className="mb-8 flex flex-col gap-12" style={{ height: 'calc(100vh-100px)' }}>
      <Card className="bg-gray-50 p-7 rounded-none shadow-none">
        <CardBody className="pb-2 bg-white rounded-xl">
          <PageHeader
            title={`Đơn đặt hàng ${order?.poCode || ""}`}
            showAdd={false}
            onImport={() => {/* Xử lý import nếu có */ }}
            onExport={exportToExcelFromTemplate}
            showImport={false} // Ẩn nút import nếu không dùng
            showExport={true} // Ẩn xuất file nếu không dùng
          />

          <div className="mb-4 flex border-b">
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Thông tin đơn hàng" value="orderInfo" />
              <Tab label="Danh sách sản phẩm" value="productList" />
            </Tabs>
          </div>
          {activeTab === "orderInfo" && (
            <div>
              <Typography variant="h6" className="flex items-center mb-4 text-black">
                <InformationCircleIcon className="h-5 w-5 mr-2" />
                Thông tin chung
              </Typography>
              <div className="grid grid-cols-3 gap-4 mb-10">
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Mã đơn</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={order.poCode}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                  />
                </div>
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Trạng thái đơn hàng</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={getStatusLabel(order.status)}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                  />
                </div>
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Ngày tạo đơn</Typography>
                  <style>
                    {`.MuiPickersCalendarHeader-label { text-transform: capitalize !important; }`}
                  </style>
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
                    <DatePicker
                      value={order.orderDate ? dayjs(order.orderDate) : null}
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
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>

              <Typography variant="h6" className="flex items-center mb-4 text-black">
                <IdentificationIcon className="h-5 w-5 mr-2" />
                Thông tin nhà cung cấp
              </Typography>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Tên nhà cung cấp</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={order.supplierName || "không có thông tin"}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                  />
                </div>
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Người liên hệ</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={order.supplierContactName || "không có thông tin"}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                  />
                </div>
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Địa chỉ</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={order.supplierAddress || "không có thông tin"}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                  />
                </div>
                <div>
                  <Typography variant="medium" className="mb-1 text-black">Số điện thoại</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    color="success"
                    variant="outlined"
                    disabled
                    value={order.supplierPhone || "không có thông tin"}
                    sx={{
                      '& .MuiInputBase-root.Mui-disabled': {
                        bgcolor: '#eeeeee',
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          {activeTab === "productList" && (
            <div className="mb-4">
              <Typography variant="h6" className="flex items-center mb-4 text-black">
                <ListBulletIcon className="h-5 w-5 mr-2" />
                Danh sách sản phẩm
              </Typography>

              {items.length === 0 ? (
                <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-600">
                  Không có sản phẩm nào trong đơn hàng này.
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table
                    data={data}
                    columnsConfig={columnsConfig}
                    enableSelection={false}
                  />
                </div>
              )}
            </div>
          )}
          <div className="mt-6 border-t py-4 flex justify-start">
            <Button
              color="info"
              size="medium"
              variant="outlined"
              sx={{
                height: '36px',
                color: '#616161',
                borderColor: '#9e9e9e',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#757575',
                },
              }}
              onClick={() => navigate("/user/purchaseOrder")}
              className="flex items-center gap-2"
            >
              <FaArrowLeft className="h-3 w-3" /> Quay lại
            </Button>
          </div>
        </CardBody>
      </Card>
    </div >
  );
};

export default PurchaseOrderDetail;
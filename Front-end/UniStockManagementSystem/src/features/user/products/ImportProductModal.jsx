import React, { useState } from "react";
import { Button, Typography } from "@material-tailwind/react";
import { previewImport, importExcel, downloadProductTemplate } from "@/features/user/products/productService";
import ReactPaginate from "react-paginate";
import { ArrowRightIcon, ArrowLeftIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { Button as MuiButton } from '@mui/material';
import { FaArrowLeft } from "react-icons/fa";
import * as XLSX from "xlsx";

const ImportProductModal = ({ open, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(5);
    const [isValidTemplate, setIsValidTemplate] = useState(false);

    // Cập nhật expectedHeaders để khớp với header từ backend
    const expectedHeaders = ["Mã sản phẩm", "Tên sản phẩm", "Đơn vị", "Dòng sản phẩm", "Mô tả"];

    const validateExcelTemplate = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                    const headers = jsonData[0];
                    if (!headers) {
                        setError("File Excel không có dữ liệu hoặc không đúng định dạng!");
                        setIsValidTemplate(false);
                        resolve(false);
                        return;
                    }

                    const isValid = expectedHeaders.every((header, index) => headers[index] === header);
                    if (!isValid) {
                        setError("File Excel không đúng định dạng template! Vui lòng sử dụng template được cung cấp.");
                        setIsValidTemplate(false);
                        resolve(false);
                    } else {
                        setError("");
                        setIsValidTemplate(true);
                        resolve(true);
                    }
                } catch (err) {
                    setError("Lỗi khi đọc file Excel: " + err.message);
                    setIsValidTemplate(false);
                    resolve(false);
                }
            };
            reader.onerror = () => {
                setError("Lỗi khi đọc file Excel!");
                setIsValidTemplate(false);
                resolve(false);
            };
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            setIsValidTemplate(false);
            setError("");
            setPreviewData([]);
            setStep(1);
            return;
        }

        if (!file.name.endsWith(".xlsx")) {
            setError("Vui lòng chọn file Excel (.xlsx)!");
            setSelectedFile(null);
            setIsValidTemplate(false);
            return;
        }

        const isValid = await validateExcelTemplate(file);
        if (isValid) {
            setSelectedFile(file);
            setPreviewData([]);
            setStep(1);
            setError("");
        } else {
            setSelectedFile(null);
        }
    };

    const handlePreview = async () => {
        if (!selectedFile || !isValidTemplate) return;
        setLoading(true);
        try {
            const res = await previewImport(selectedFile);
            setPreviewData(res);
            setStep(2);
            setCurrentPage(0);
        } catch (err) {
            setError("Lỗi khi xem trước dữ liệu. Vui lòng kiểm tra lại file.");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setLoading(true);
        try {
            await importExcel(selectedFile);
            onSuccess();
            onClose();
        } catch (err) {
            setError("Lỗi khi nhập dữ liệu: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadProductTemplate();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "template_import_sanpham.xlsx");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError("Lỗi khi tải tệp mẫu: " + err.message);
        }
    };

    const validCount = previewData.filter((row) => row.valid).length;
    const invalidCount = previewData.filter((row) => !row.valid).length;
    const filteredData =
        filter === "valid"
            ? previewData.filter((r) => r.valid)
            : filter === "invalid"
                ? previewData.filter((r) => !r.valid)
                : previewData;

    const pageCount = Math.ceil(filteredData.length / pageSize);
    const paginatedData = filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    return (
        open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                <div className="bg-white p-6 w-full max-w-5xl rounded shadow-xl overflow-y-auto max-h-[90vh]">
                    {step === 1 && (
                        <>
                            <Typography variant="h6" className="mb-4">Bước 1: Chọn tệp Excel để nhập</Typography>
                            <div className="mb-4">
                                <input
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="border p-2 rounded w-full"
                                />
                                <div className="mt-2">
                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                                    >
                                        <PaperClipIcon className="h-4 w-4" />
                                        Tải tệp mẫu
                                    </button>
                                </div>
                            </div>
                            {error && <Typography color="red" className="mb-2">{error}</Typography>}
                            <div className="flex justify-end gap-2">
                                <MuiButton
                                    size="medium"
                                    color="error"
                                    variant="outlined"
                                    onClick={onClose}
                                >
                                    Hủy
                                </MuiButton>
                                <Button
                                    size="lg"
                                    color="white"
                                    variant="text"
                                    className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                                    ripple={true}
                                    onClick={handlePreview}
                                    disabled={!selectedFile || !isValidTemplate || loading}
                                >
                                    {loading ? "Đang kiểm tra..." : "Tiếp tục"}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Typography variant="h6" className="mb-4">Bước 2: Xem trước dữ liệu</Typography>
                            <div className="text-sm text-gray-600 mb-2">
                                <span className="text-green-600 font-medium">{validCount} dòng hợp lệ</span> - <span className="text-red-600 font-medium">{invalidCount} dòng không hợp lệ</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
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
                                        {[5, 10, 20, 50].map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        bản ghi mỗi trang
                                    </Typography>
                                </div>
                                <div>
                                    <select value={filter} onChange={(e) => setFilter(e.target.value)} className="p-2 border rounded">
                                        <option value="all">Tất cả</option>
                                        <option value="valid">Hợp lệ</option>
                                        <option value="invalid">Không hợp lệ</option>
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-auto max-h-[50vh] border rounded">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border px-2 py-1">Dòng số</th>
                                            <th className="border px-2 py-1">Mã SP</th>
                                            <th className="border px-2 py-1">Tên SP</th>
                                            <th className="border px-2 py-1">Đơn vị</th>
                                            <th className="border px-2 py-1">Dòng SP</th>
                                            <th className="border px-2 py-1">Tình trạng</th>
                                            <th className="border px-2 py-1">Chi tiết lỗi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="border px-2 py-1 text-center">{row.rowIndex}</td>
                                                <td className="border px-2 py-1">{row.productCode}</td>
                                                <td className="border px-2 py-1">{row.productName}</td>
                                                <td className="border px-2 py-1">{row.unitName}</td>
                                                <td className="border px-2 py-1">{row.productTypeName}</td>
                                                <td className="border px-2 py-1 text-center font-semibold">
                                                    <span className={row.valid ? "text-green-600" : "text-red-600"}>{row.valid ? "Hợp lệ" : "Không hợp lệ"}</span>
                                                </td>
                                                <td className="border px-2 py-1 whitespace-pre-line">{row.errorMessage}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between border-t border-blue-gray-50 py-4">
                                <div className="flex items-center gap-2">
                                    <MuiButton
                                        color="info"
                                        size="medium"
                                        variant="outlined"
                                        sx={{
                                            color: '#616161',
                                            borderColor: '#9e9e9e',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5',
                                                borderColor: '#757575',
                                            },
                                        }}
                                        onClick={() => setStep(1)}
                                        className="flex items-center gap-2"
                                    >
                                        <FaArrowLeft className="h-3 w-3" /> Quay lại
                                    </MuiButton>
                                    <Typography variant="small" color="blue-gray" className="font-normal">
                                        Trang {currentPage + 1} / {pageCount} • {filteredData.length} bản ghi
                                    </Typography>
                                </div>
                                <ReactPaginate
                                    previousLabel={<ArrowLeftIcon strokeWidth={2} className="h-4 w-4" />}
                                    nextLabel={<ArrowRightIcon strokeWidth={2} className="h-4 w-4" />}
                                    breakLabel="..."
                                    pageCount={pageCount}
                                    marginPagesDisplayed={2}
                                    pageRangeDisplayed={5}
                                    onPageChange={({ selected }) => setCurrentPage(selected)}
                                    containerClassName="flex items-center gap-1"
                                    pageClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                                    pageLinkClassName="flex items-center justify-center w-full h-full"
                                    previousClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                                    nextClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700 border border-gray-300 hover:bg-gray-100"
                                    breakClassName="h-8 min-w-[32px] flex items-center justify-center rounded-md text-xs text-gray-700"
                                    activeClassName="bg-[#0ab067] text-white border-[#0ab067] hover:bg-[#0ab067]"
                                    forcePage={currentPage}
                                    disabledClassName="opacity-50 cursor-not-allowed"
                                />
                                <Button
                                    size="lg"
                                    color="white"
                                    variant="text"
                                    className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                                    ripple={true}
                                    onClick={handleImport}
                                    disabled={invalidCount > 0 || loading}
                                >
                                    {loading ? "Đang nhập..." : "Nhập sản phẩm"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    );
};

export default ImportProductModal;
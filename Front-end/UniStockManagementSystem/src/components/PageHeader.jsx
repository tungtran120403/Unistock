import React from "react";
import { Typography, Button } from "@material-tailwind/react";
import { FaPlus } from "react-icons/fa";
import { BiExport, BiImport } from "react-icons/bi";

const PageHeader = ({
    title,
    onAdd,
    onImport,
    onExport,
    showAdd = true,
    showImport = true,
    showExport = true,
    addButtonLabel = "Thêm",
    customButtons = null, // Add this prop
}) => {
    return (
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-300">
            <Typography variant="h4" color="black">
                {title}
            </Typography>
            <div className="flex gap-2">
                {showImport && (
                    <Button
                        size="sm"
                        variant="contained"
                        className="flex items-center gap-2 bg-white border shadow-none hover:shadow-none rounded-[4px] text-[#089456] border-[#089456] hover:bg-[#089456]/10"
                        onClick={onImport}
                    >
                        <BiImport className="h-5 w-5" /> Nhập
                    </Button>
                )}
                {showExport && (
                    <Button
                        size="sm"
                        color="black"
                        variant="contained"
                        className="flex items-center gap-2 bg-white border shadow-none hover:shadow-none rounded-[4px] text-[#089456] border-[#089456] hover:bg-[#089456]/10"
                        onClick={onExport}
                    >
                        <BiExport className="h-5 w-5" /> Xuất
                    </Button>
                )}
                {showAdd && (
                    <Button
                        size="sm"
                        color="white"
                        className="bg-[#0ab067] hover:bg-[#089456]/90 shadow-none hover:shadow-none text-white font-medium py-2 px-4 rounded-[4px] transition-all duration-200 ease-in-out"
                        variant="contained"
                        ripple={true}
                        onClick={onAdd}
                    >
                        <div className='flex items-center gap-2'>
                            <FaPlus className="h-4 w-4" />
                            <span>{addButtonLabel}</span>
                        </div>
                    </Button>
                )}
                {customButtons}
            </div>
        </div>
    );
};

export default PageHeader;

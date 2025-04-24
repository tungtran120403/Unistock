import React, { useState } from "react";
import { Button, Popover, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { FaAngleDown } from "react-icons/fa";
import dayjs from "dayjs";
import "dayjs/locale/vi";

const DateFilterButton = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  setCurrentPage
}) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(0);
  };

  return (
    <div>
      <Button
        onClick={(event) => setAnchorEl(event.currentTarget)}
        size="sm"
        variant={(startDate || endDate) ? "outlined" : "contained"}
        sx={{
          ...(startDate || endDate
            ? {
                backgroundColor: "#ffffff",
                boxShadow: "none",
                borderColor: "#089456",
                textTransform: "none",
                color: "#089456",
                px: 1.5,
                "&:hover": {
                  backgroundColor: "#0894561A",
                  borderColor: "#089456",
                  boxShadow: "none",
                },
              }
            : {
                backgroundColor: "#0ab067",
                boxShadow: "none",
                textTransform: "none",
                color: "#ffffff",
                px: 1.5,
                "&:hover": {
                  backgroundColor: "#089456",
                  borderColor: "#089456",
                  boxShadow: "none",
                },
              }),
        }}
      >
        {(startDate || endDate) ? (
          startDate === endDate && startDate ? (
            dayjs(startDate).format("DD/MM/YYYY")
          ) : (
            `${startDate ? dayjs(startDate).format("DD/MM/YYYY") : "__/__/____"} - ${endDate ? dayjs(endDate).format("DD/MM/YYYY") : "__/__/____"}`
          )
        ) : (
          <span className="flex items-center gap-[5px]">
            Khoảng thời gian <FaAngleDown className="h-4 w-4" />
          </span>
        )}
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <div className="flex gap-4 p-4 w-[450px]">
          <style>
            {`.MuiPickersCalendarHeader-label { text-transform: capitalize; }`}
          </style>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <div>
              <Typography variant="small" className="mb-1 text-black">Từ ngày</Typography>
              <DatePicker
                value={startDate ? dayjs(startDate) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    setStartDate(newValue.format("YYYY-MM-DD"));
                  }
                }}
                format="DD/MM/YYYY"
                dayOfWeekFormatter={(weekday) => `${weekday.format("dd")}`}
                slotProps={{
                  day: {
                    sx: () => ({
                      "&.Mui-selected": {
                        backgroundColor: "#0ab067 !important",
                        color: "white",
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: "#089456 !important",
                      },
                      "&:hover": {
                        backgroundColor: "#0894561A !important",
                      },
                    }),
                  },
                  textField: {
                    hiddenLabel: true,
                    fullWidth: true,
                    placeholder: "Từ ngày",
                    size: "small",
                    color: "success",
                  },
                }}
              />
            </div>
            <div>
              <Typography variant="small" className="mb-1 text-black">Đến ngày</Typography>
              <DatePicker
                value={endDate ? dayjs(endDate) : null}
                onChange={(newValue) => {
                  if (newValue) {
                    setEndDate(newValue.format("YYYY-MM-DD"));
                  }
                }}
                format="DD/MM/YYYY"
                dayOfWeekFormatter={(weekday) => `${weekday.format("dd")}`}
                slotProps={{
                  day: {
                    sx: () => ({
                      "&.Mui-selected": {
                        backgroundColor: "#0ab067 !important",
                        color: "white",
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: "#089456 !important",
                      },
                      "&:hover": {
                        backgroundColor: "#0894561A !important",
                      },
                    }),
                  },
                  textField: {
                    hiddenLabel: true,
                    fullWidth: true,
                    placeholder: "Đến ngày",
                    size: "small",
                    color: "success",
                  },
                }}
              />
            </div>
            {(startDate || endDate) && (
              <div className="flex items-end w-fit">
                <Button
                  variant="text"
                  size="medium"
                  onClick={handleClear}
                  sx={{
                    color: "#000000DE",
                    "&:hover": {
                      backgroundColor: "transparent",
                      textDecoration: "underline",
                    },
                  }}
                >
                  Xóa
                </Button>
              </div>
            )}
          </LocalizationProvider>
        </div>
      </Popover>
    </div>
  );
};

export default DateFilterButton;

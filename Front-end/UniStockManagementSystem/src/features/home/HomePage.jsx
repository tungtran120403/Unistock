import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Typography } from '@material-tailwind/react';
import {
  Divider,
  Link
} from "@mui/material";
import {
  Warehouse,
  AllInbox,
  Construction,
  Diversity3,
  Scale,
} from '@mui/icons-material';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center bg-gray-50 h-full">
      <div>
        <Card className="m-7 bg-white rounded-none shadow-none border-solid border-[1px] border-gray-300">
          <CardBody className="pt-0 h-[420px]">
            <Typography variant="h6" color="blue-gray" className="text-center py-3">
              QUY TRÌNH NGHIỆP VỤ
            </Typography>
            <Divider />

            <div className="relative flex justify-between items-center py-32 px-4 w-[600px]">
              <img
                src="/img/process-line.svg"
                alt="Process Line"
                className="absolute top-[46%] left-0 right-0 w-full transform -translate-y-1/2"
              />

              <div className="relative flex flex-col items-center w-24">
                <div
                  className="flex flex-col items-center z-10 cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition"
                  onClick={() => navigate('/user/sale-orders')}
                >
                  <img
                    src="/img/sale-order.svg"
                    className="w-[70px] h-[70px] mb-2"
                  />
                  <Typography className="text-sm text-center w-24 whitespace-nowrap">Bán hàng</Typography>
                </div>
              </div>

              <div className="relative flex flex-col items-center w-24">
                <div
                  className="flex flex-col items-center z-10 translate-y-[112px] translate-x-[50px] cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition"
                  onClick={() => navigate('/user/purchase-request')}
                >
                  <img
                    src="/img/purchase-request.svg"
                    className="w-[70px] h-[68px] mb-2 translate-x-[6px]"
                  />
                  <Typography className="text-sm text-center w-24 whitespace-nowrap">Yêu cầu mua</Typography>
                </div>
              </div>

              <div className="relative flex flex-col items-center w-24">
                <div
                  className="flex flex-col items-center z-10 -translate-y-[120px] -translate-x-[73px] cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition"
                  onClick={() => navigate('/user/issueNote')}
                >
                  <img
                    src="/img/export.svg"
                    className="w-[70px] h-[70px] mb-2 translate-x-[-8px] translate-y-[6px]"
                  />
                  <Typography className="text-sm text-center w-24 whitespace-nowrap">Xuất kho</Typography>
                </div>
              </div>

              <div className="relative flex flex-col items-center w-24">
                <div
                  className="flex flex-col items-center z-10 translate-y-[112px] translate-x-[-14px] cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition"
                  onClick={() => navigate('/user/purchaseOrder')}
                >
                  <img
                    src="/img/purchase-order.svg"
                    className="w-[70px] h-[68px] mb-2 translate-y-[2px] translate-x-[5px]"
                  />
                  <Typography className="text-sm text-center w-24 whitespace-nowrap">Đơn mua hàng</Typography>
                </div>
              </div>

              <div className="relative flex flex-col items-center w-24">
                <div
                  className="flex flex-col items-center z-10 -translate-y-[120px] translate-x-[-87px] cursor-pointer hover:bg-gray-100 rounded-lg p-2 transition"
                  onClick={() => navigate('/user/receiptNote')}
                >
                  <img
                    src="/img/import.svg"
                    className="w-[70px] h-[70px] mb-2 translate-x-[-8px] translate-y-[6px]"
                  />
                  <Typography className="text-sm text-center w-24 whitespace-nowrap">Nhập kho</Typography>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-center flex-wrap bg-white mx-7 mb-7 rounded-none shadow-none border border-gray-300">
          {/* Kho */}
          <div
            className="flex flex-col items-center justify-center w-[132px] h-[70px] border-r border-gray-300 cursor-pointer hover:bg-gray-100"
            onClick={() => navigate('/user/warehouse')}
          >
            <Warehouse sx={{ fontSize: 30 }} className="text-green-600 mb-1" />
            <Typography className="text-sm text-center">Kho</Typography>
          </div>

          {/* Vật tư */}
          <div
            className="flex flex-col items-center justify-center w-32 h-[70px] border-r border-gray-300 cursor-pointer hover:bg-gray-100"
            onClick={() => navigate('/user/materials')}
          >
            <Construction sx={{ fontSize: 30 }} className="text-green-600 mb-1" />
            <Typography className="text-sm text-center">Vật tư</Typography>
          </div>

          {/* Sản phẩm */}
          <div
            className="flex flex-col items-center justify-center w-32 h-[70px] border-r border-gray-300 cursor-pointer hover:bg-gray-100"
            onClick={() => navigate('/user/products')}
          >
            <AllInbox sx={{ fontSize: 30 }} className="text-green-600 mb-1" />
            <Typography className="text-sm text-center">Sản phẩm</Typography>
          </div>

          {/* Đơn vị tính */}
          <div
            className="flex flex-col items-center justify-center w-32 h-[70px] border-r cursor-pointer hover:bg-gray-100"
            onClick={() => navigate('/user/unit')}
          >
            <Scale sx={{ fontSize: 30 }} className="text-green-600 mb-1" />
            <Typography className="text-sm text-center">Đơn vị tính</Typography>
          </div>

          {/* Đối tác */}
          <div
            className="flex flex-col items-center justify-center w-[132px] h-[70px] cursor-pointer hover:bg-gray-100"
            onClick={() => navigate('/user/partner/list')}
          >
            <Diversity3 sx={{ fontSize: 30 }} className="text-green-600 mb-1" />
            <Typography className="text-sm text-center">Đối tác</Typography>
          </div>
        </div>
      </div>

      <Card className="w-80 h-[520px] bg-white px-6 pb-6 pt-0 rounded-none shadow-none border-solid border-[1px] border-gray-300">
        <CardBody className="p-0">
          <Typography variant="h6" color="blue-gray" className="text-center py-3">
            BÁO CÁO
          </Typography>
          <Divider />

          <div className="flex flex-col items-stretch justify-stretch flex-1 h-full">
            <Link
              href="/user/report/inventory"
              underline="hover"
              color="blue-gray"
              sx={{
                '&:hover': { color: 'black' },
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: '30px',
                gap: 1,
              }}
            >
              Báo cáo tồn kho
            </Link>
            <Divider />
            <Link
              href="/user/report/receipt"
              underline="hover"
              color="blue-gray"
              sx={{
                '&:hover': { color: 'black' },
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: '30px',
                gap: 1,
              }}
            >
              Báo cáo nhập kho
            </Link>
            <Divider />
            <Link
              href="/user/report/issue"
              underline="hover"
              color="blue-gray"
              sx={{
                '&:hover': { color: 'black' },
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: '30px',
                gap: 1,
              }}
            >
              Báo cáo xuất kho
            </Link>
            <Divider />
            <Link
              href="/user/report/stock-movement"
              underline="hover"
              color="blue-gray"
              sx={{
                '&:hover': { color: 'black' },
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: '30px',
                gap: 1,
              }}
            >
              Báo cáo xuất nhập tồn
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
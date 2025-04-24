import PropTypes from "prop-types";
import { Typography } from "@material-tailwind/react";
import { HeartIcon } from "@heroicons/react/24/solid";

export function Footer({ brandName, brandLink, routes }) {
  const year = new Date().getFullYear();

  return (
    <footer className="py-2 bg-dark text-black text-center p-3 mt-5 bg-gray-50">
      <div className="container flex flex-wrap items-center justify-center gap-6 px-2 md:justify-between">
        {/* Thông tin bản quyền */}
        <Typography variant="small" className="font-normal text-inherit">
          &copy; {year}, made with{" "}
          <HeartIcon className="-mt-0.5 inline-block h-3.5 w-3.5 text-red-600" /> by{" "}
          <a
            href={brandLink}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-blue-500 font-bold"
          >
            {brandName}
          </a>{" "}
          for a better web.
        </Typography>

        {/* Danh sách link */}
        <ul className="flex items-center gap-4">
          {routes.map(({ name, path }) => (
            <li key={name}>
              <Typography
                as="a"
                href={path}
                target="_blank"
                rel="noopener noreferrer"
                variant="small"
                className="py-0.5 px-1 font-normal text-inherit transition-colors hover:text-blue-500"
              >
                {name}
              </Typography>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}

// Giá trị mặc định nếu không truyền props
Footer.defaultProps = {
  brandName: "Tungtran",
  brandLink: "https://www.facebook.com/tungdzai1204/",
  routes: [
    { name: "Tungtran", path: "https://www.facebook.com/tungdzai1204/" },
    { name: "About Us", path: "https://www.facebook.com/tungdzai1204/" },
    { name: "Blog", path: "https://www.facebook.com/tungdzai1204/" },
    { name: "License", path: "https://www.facebook.com/tungdzai1204/" },
  ],
};

// Xác định kiểu dữ liệu cho props
Footer.propTypes = {
  brandName: PropTypes.string,
  brandLink: PropTypes.string,
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
    })
  ),
};

// Đặt tên hiển thị trong React DevTools
Footer.displayName = "/src/features/admin/dashboard/footer.jsx";

export default Footer;
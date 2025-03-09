const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// Sử dụng bodyParser để xử lý dữ liệu từ phương thức POST
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Đường dẫn đến thư mục .output/server để phục vụ các tệp tĩnh
const staticOutputPath = path.join(__dirname, '.output', 'server');

// Phục vụ các tệp tĩnh từ thư mục .output/server
app.use(express.static(staticOutputPath));

// Bổ sung các routes khác của ứng dụng của bạn ở đây

// Khởi động máy chủ
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

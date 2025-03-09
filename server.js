const express = require('express');
const client = require('./ConnectDatabase/his_ace')
const axios = require('axios');
const cronSMSPack = require('./APIs/Actions/PatientAppointment/send_sms_due_up')
const syncHealthCOntract = require('./APIs/PhuongDong/select/company')

const bodyParser = require('body-parser');
// const twilioConfig = require('./middlewares/twilioConfig');
// const clientTwilio = require('twilio')(twilioConfig.accountSid, twilioConfig.authToken);

// Thư viện rút gọn link
// const { customAlphabet } = require('nanoid');
const cron = require('node-cron');
var app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const auth = require('./middlewares/auth')
const path = require('path');
const multer = require('multer'); // Import multer for handling multipart/form-data
const sharp = require('sharp'); // Import sharp for image processing

const shortid = require('shortid');

const fs = require('fs'); // Import the fs module
const { verify } = require('crypto');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))


// Đường dẫn đến thư mục .output tạo bởi yarn build
const staticOutputPath = path.join(__dirname, '.output', 'server');

// Phục vụ các tệp tĩnh từ thư mục .output
app.use(express.static(staticOutputPath));

const allowedOrigins = [
  process.env.DOMAIN_WEB,
  // 'http://192.168.89.232:3000',
  // Thêm origins khác nếu cần
];
// cấu hình cho phép cổng truy cập
app.all('/*', function (req, res, next) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  // res.header("Access-Control-Allow-Origin", ['http://localhost:3000', 'http://192.168.89.232:3000',]);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Thiết lập cron job chạy gửi sms hẹn khám vào mỗi 11h20 sáng hàng ngày
cron.schedule('20 11 * * *', async () => {
  // Thực hiện công việc bạn muốn ở đây
  try {
    console.log('Cron job đã được kích hoạt vào 6h sáng hàng ngày!');
    await cronSMSPack()
  }
  catch (e) {
    console.log('Gửi SMS hẹn khám thất bại!');
  }
});

// cron chạy đồng bộ danh sách gói khám công ty theo ngày
cron.schedule('10 21 * * *', async () => {
  try {
    await syncHealthCOntract()
    console.log('Response from API:', response.data);
  } catch (error) {
    console.error('Error calling API:', error);
  }
});

// ==IMAGE==
// Configure multer to save uploaded files in a specific directory
const storage_img = multer.memoryStorage(); // Store uploaded files in memory
const upload_img = multer({ storage_img });

// lấy ảnh gửi lên từ client lưu vào server
app.post('/upload-logo-company', upload_img.single('image'), require('./APIs/Actions/HandleFile/upload_logo'));

// app.post('/upload-logo-company', upload_img.single('image'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(800).send('No image uploaded.');
//     }

//     const optimizedImageBuffer = await sharp(req.file.buffer)
//       .resize({ width: 400 })
//       .jpeg({ quality: 80 })
//       .toBuffer();
//     // Save the optimized image to the public/img directory
//     console.log('req.file.originalname', req.file.originalname);
//     const convertImageName = req.file.originalname.split('.')[0] + '.jpg'
//     console.log('convertImageName', convertImageName);
//     const imagePath = path.join(__dirname, 'assets', 'CompanyLogos', convertImageName);
//     fs.writeFileSync(imagePath, optimizedImageBuffer);

//     res.status(200).send('Image uploaded, optimized, and saved.');
//   } catch (error) {
//     console.error('Error uploading and saving image:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });

// gửi logo công ty về client
app.get('/get_logo_company', (req, res) => {
  console.log('lấy dữ liệu hình ảnh...');
  // 
  if (req.query.imageName) {
    const imageName = req.query.imageName;
    console.log('imageName', req.query.imageName);
    const imagePath = path.join(__dirname, 'assets/CompanyLogos/', imageName); // Đường dẫn tới tệp ảnh
    res.sendFile(imagePath);
  }
  console.log('hoàn tất');
});

// ==LOGIN==
app.get('/login', require('./APIs/login'));

app.get('/auth', auth, function (req, res) {
  // console.log('req after verify', req);
  if (req.verify) {
    res.json({
      acceptLogin: true,
      verify: req.verify
    })
  } else {
    res.json({
      acceptLogin: false
    })
  }
})
app.get('/fetch-user', auth, function (req, res) {
  if (req.verify) {
    res.json({
      permission: req.verify.permission ? req.verify.permission : null,
      company_id: req.verify.company_id ? req.verify.company_id : null
    })
  } else {
    res.status(500).json({ error: 'Token expired!' });
  }
})

// * lỗi phát sinh khi bỏ cụm code gửi sms trên cụm convert hình ảnh
// VARIABLE
const urlMap = {};

// Middleware để truyền biến vào request object
app.use((req, res, next) => {
  req.urlMap = urlMap;
  next();
});

// ==DATA TABLE==
// --companies--
// select
app.get('/select-companies', auth, require('./APIs/DataTables/Selects/companies'));
app.get('/select-client-companies', auth, require('./APIs/DataTables/Selects/client/companies'));
// insert
app.get('/insert-companies', auth, require('./APIs/DataTables/Inserts/companies'));
// update
app.get('/update-companies', auth, require('./APIs/DataTables/Updates/companies'));
// delete
app.get('/delete-companies', auth, require('./APIs/DataTables/Deletes/companies'));

// --appointment_schedules--
// select
app.get('/select-appointments', auth, require('./APIs/DataTables/Selects/appointment_schedules'));
app.get('/select-appointments-mutate', auth, require('./APIs/DataTables/Selects/appointment_schedules_mutate'));
// insert
// app.get('/insert-appointments', require('./APIs/DataTables/Inserts/companies'));
// update
// app.get('/update-appointments', require('./APIs/DataTables/Updates/companies'));
// delete
// app.get('/delete-appointments', require('./APIs/DataTables/Deletes/companies'));

// --company_service_packs--
// select
app.get('/select-company-service-packs', auth, require('./APIs/DataTables/Selects/company_service_packs'));
app.get('/select-company-service-packs-manager', auth, require('./APIs/DataTables/Selects/manager/company_service_packs_manager'));
app.get('/select-packs-of-company', require('./APIs/DataTables/Selects/packs_of_company'));
app.get('/browse-packs', require('./APIs/DataTables/Selects/browse_packs'));
app.get('/admin-real-num-of-pack', auth, require('./APIs/DataTables/Selects/admin/real_num_of_pack'));
app.get('/manager-real-num-of-pack', auth, require('./APIs/DataTables/Selects/manager/real_num_of_pack'));
// update
app.post('/accept-browse-pack', auth, require('./APIs/DataTables/Updates/accept_browse_pack'));
app.post('/update-pack-info', auth, require('./APIs/DataTables/Updates/update_pack_info'));
app.post('/update-real-num-of-pack', auth, require('./APIs/DataTables/Updates/real_num_of_pack'));
// delete
app.post('/delete-company-service-packs', require('./APIs/DataTables/Deletes/company_service_packs'));

// --patients--
// select
app.get('/select-patients', auth, require('./APIs/DataTables/Selects/patients'));
app.get('/select-patients-manager', auth, require('./APIs/DataTables/Selects/manager/patients'));
app.get('/select-patients-of-pack', auth, require('./APIs/DataTables/Selects/patients_of_pack'));
// insert
// update
app.get('/update-patients', require('./APIs/DataTables/Updates/patients'));
// delete
app.post('/delete-patients', require('./APIs/DataTables/Deletes/patients'));

// --appointment_company_service_packs--
// select
app.get('/select-session-packs', require('./APIs/DataTables/Selects/appointment_company_service_packs'));
// insert
// update
// delete
app.post('/delete-session-pack', auth, require('./APIs/DataTables/Deletes/delete_session_pack'));

// ===Action===
// Lấy bệnh nhân cho gói khám
app.get('/auth-email-patient', auth, require('./APIs/Actions/PatientAppointment/get_patient_appointment'));

// Đếm số lượng bệnh nhân của pack_id - sesion_id
app.get('/get-patient-appointment-total', require('./APIs/Actions/PatientAppointment/get_patient_appointment_total'));

// Thêm gói khám cho công ty
app.post('/add-pack', require('./APIs/Actions/PackSchedule/add_pack'));

// Thêm lịch khám cho công ty
app.post('/add-pack-schedule', require('./APIs/Actions/PackSchedule/add_pack_schedule'));

// Cập nhật lịch cho gói khám
app.post('/update-pack-schedule', require('./APIs/Actions/PackSchedule/update_pack_schedule'))

// Cập nhật trạng thái gói khám về 0
app.post('/update-pack-status', require('./APIs/Actions/PackSchedule/update_pack_status'))

// Xóa lịch cho gói khám
app.post('/delete-pack-schedule', require('./APIs/Actions/PackSchedule/delete_pack_schedule'))

// Thêm bệnh nhân cho gói khám
app.post('/add-patient-appointment', require('./APIs/Actions/PatientAppointment/add_patient_appointment'));

// Thêm lịch cho gói khám
app.post('/add-schedule-session', require('./APIs/Actions/ScheduleSession/add_schedule_session'));

// Sửa giới hạn slot buổi khám
app.post('/update-session-limit', require('./APIs/Actions/ScheduleSession/update_session_limit'));

// Xóa buổi khám
app.post('/delete-session', auth, require('./APIs/Actions/ScheduleSession/delete_session'));

// Cập nhật bệnh nhân cho gói khám
app.post('/update-patient-appointment', require('./APIs/Actions/PatientAppointment/update_patient_appointment'));

// Gửi email
app.post('/send-email', require('./APIs/Actions/PatientAppointment/send_email'));

app.post('/send-email-2', require('./APIs/Actions/PatientAppointment/send_email_2'));

// Gửi SMS
app.post('/send-sms', auth, require('./APIs/Actions/PatientAppointment/send_sms'));
app.post('/send-sms-update', require('./APIs/Actions/PatientAppointment/send_sms_update'));

// --Other
// quick select package_ids
app.get('/quick-select-package_ids', auth, require('./APIs/Actions/Other/QuickSelect/package_ids'));

// ==SMS==
// app.post('/shorten', (req, res) => {
//   const originalUrl = req.body.url;
//   const shortUrl = shortid.generate();
//   urlMap[shortUrl] = originalUrl;
//   res.json({ shortUrl: `http://localhost:8082/${shortUrl}` });
// });

// Endpoint để chuyển hướng từ short URL đến đường dẫn gốc
// app.get('/:shortUrl', (req, res) => {
//   const shortUrl = req.params.shortUrl;
//   const originalUrl = urlMap[shortUrl];

//   if (originalUrl) {
//     res.redirect(originalUrl);
//   } else {
//     res.status(404).json({ error: 'Link not found' });
//   }
// });

// test
app.get('/test-api', require('./APIs/Actions/test_api'));

// kết quả gửi tin zalo
app.get('/result-zalo', require('./APIs/Actions/callback/result_zalo'));

app.post('/result-zalo', require('./APIs/Actions/callback/result_zalo'));

// api test
app.post('/test-api', require('./APIs/Actions/test_api'));

// ====================OAPI
// lấy token
app.post('/oapi-get-token', require('./APIs/OAPI/get_token'));

// select company
app.post('/oapi-select-company', auth, require('./APIs/OAPI/select/select_company'));

// insert company
app.post('/oapi-insert-company', auth, require('./APIs/OAPI/insert/insert_company'));

// delete company
app.post('/oapi-delete-company', auth, require('./APIs/OAPI/delete/delete_company'));

// select pack
app.post('/oapi-select-pack', auth, require('./APIs/OAPI/select/select_pack'));

// insert pack
app.post('/oapi-insert-pack', auth, require('./APIs/OAPI/insert/insert_pack'));

// delete pack
app.post('/oapi-delete-pack', auth, require('./APIs/OAPI/delete/delete_pack'));

// select patient
app.post('/oapi-select-patients', auth, require('./APIs/OAPI/select/select_patients'));

// insert patient
app.post('/oapi-insert-patients', auth, require('./APIs/OAPI/insert/insert_patients'));

// delete pack
app.post('/oapi-delete-patients', auth, require('./APIs/OAPI/delete/delete_patients'));

// delete patient
// app.post('/oapi-delete-patient', auth, require('./APIs/OAPI/delete/delete_patient'));

// ===============================PHƯƠNG ĐÔNG=============================
// get company
app.post('/get-company-pd', auth, require('./APIs/PhuongDong/select/company'));

// lấy danh sách báo cáo dặt hẹn
app.get('/select-appointment-report', auth, require('./APIs/DataTables/Selects/appointment_report'));

app.get('/select-appointment-report-manager', auth, require('./APIs/DataTables/Selects/manager/appointment_report_manager'));

app.get('/:shortUrl', require('./middlewares/short_url'));

const ipAddress = '192.168.100.117';
// var server = app.listen(process.env.PORT, ipAddress, function () {
//   console.log("App runing on: " + server.address().address + ":" + server.address().port);
// })
var server = app.listen(process.env.PORT, '0.0.0.0', function () {
  console.log("App runing on: " + server.address().address + ":" + server.address().port);
})

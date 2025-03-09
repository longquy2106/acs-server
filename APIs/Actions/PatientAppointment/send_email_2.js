// server/APIs/login.js
const express = require('express');
const { request, gql } = require('graphql-request');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const nodemailer = require('nodemailer');
require('dotenv').config();
const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
const querystring = require('querystring');
const app = express();
app.use(express.json());
// Tạo một transporter với tài khoản Gmail của người gửi

module.exports = async function (req, res) {
  const email = req.body?.variable
  const id_patient = req.body?.id_patient
  const urlMap = req.urlMap;
  console.log('req.body?.variable', req.body?.variable);
  console.log('req.body?.id_patient', req.body?.id_patient);
  if (email && id_patient) {
    console.log('have email');
    let ToKen = null
    const dateQuery = gql`
      query MyQuery {
        his_ace_patients(where: {id: {_eq: "${id_patient}"}}) {
          id
          medical_code
          company_service_pack {
            appointment_company_service_packs(limit: 1, order_by: {appointment_session: {appointment_schedule: {date: asc}}}) {
              appointment_session {
                appointment_schedule {
                  date
                }
              }
            }
          }
        }
      }
      `
    const dateVariables = {
    };
    await request(endpoint, dateQuery, dateVariables, headers)
      .then(async function (results) {
        console.log(results.his_ace_patients[0]?.company_service_pack?.appointment_company_service_packs[0]
        )
        // kiểm tra có dữ liệu đã insert hay không
        if (results.his_ace_patients[0]?.company_service_pack?.appointment_company_service_packs[0]
          ?.appointment_session?.appointment_schedule?.date) {
          const dateString = results.his_ace_patients[0]?.company_service_pack?.appointment_company_service_packs[0]
            ?.appointment_session?.appointment_schedule?.date
          // Chuyển đổi biến ngày sang đối tượng Date
          const dateToCompare = new Date(dateString);

          dateToCompare.setDate(dateToCompare.getDate() - 3);
          // Lấy ngày hiện tại
          const today = new Date();
          console.log('today', today);
          console.log('dateToCompare', dateToCompare);
          // So sánh ngày hiện tại với biến ngày
          if (today < dateToCompare) {
            console.log('ok date to today < compare');
            // Nếu ngày hiện tại bé hơn biến ngày, tính hiệu của hai ngày và lấy giá trị tuyệt đối
            const differenceInTime = Math.abs(dateToCompare.getTime() - today.getTime());
            // Chuyển đổi kết quả thành số ngày (tính theo milliseconds)
            const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
            console.log('Hiệu của hai ngày là:', differenceInDays, 'ngày');
            ToKen = jwt.sign({
              email: email,
              id: id_patient
            },
              process.env.SECRET_KEY,
              {
                expiresIn: `${differenceInDays} days`
              }
            );
          } else {
            // Ngược lại, bỏ qua
            console.log('Ngày hiện tại lớn hơn hoặc bằng ngày cần so sánh.');
          }
        }

      })
      .catch(error => {
        console.error(error)
        console.log('shortlink lưu vào csdl không thành công!');
        res.json({ success: false });
      });

    console.log('ToKen', ToKen);

    const originalUrl = `${process.env.DOMAIN_WEB}/clients/choose_appointment/?token=${ToKen}`;
    const shortUrl = shortid.generate();
    urlMap[shortUrl] = originalUrl;
    console.log('req.urlMap after add', req.urlMap);

    const tempObject = {
      short_url: shortUrl,
      original_url: originalUrl
    }
    // insert shortlinks
    const insert = gql`
            mutation MyMutation($objects: [his_ace_shortlinks_insert_input!] = {short_url: "${shortUrl}", original_url: "${originalUrl}", id_patient: "${id_patient}"}) {
            insert_his_ace_shortlinks(objects: $objects) {
              affected_rows
              returning {
                id
              }
            }
          }
        `;
    console.log('insert his_ace_shortlinks_insert_input', insert);
    const variables = {
    };
    let is_saved_link = false
    request(endpoint, insert, variables, headers)
      .then(async function (data) {
        console.log(data)
        if (data.insert_his_ace_shortlinks?.affected_rows) {
          is_saved_link = true;
          console.log('Lưu shortlink vào csdl thành công!');
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'caochithuongfk1@gmail.com',
              pass: 'wyxd ohjq yumt nmme',
            },
          });

          // Thông tin về email muốn gửi
          const mailOptions = {
            from: 'CustomerSupport@saigonent.vn <caochithuongfk1@gmail.com>',
            to: email,
            subject: 'Email xác nhận đặt lịch KSK doanh nghiệp',
            html: `<!DOCTYPE html>
            <html lang="vi">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                table {
                  width: 100%;
                  padding: 3% 15%;
                  border: 3px solid black;
                  margin: 0 auto;
                  color: #222;
                }
                table, tr, td, h1, h2{
                  color: #222;
                }
                /*td {
                  text-align: center;
                }*/
                .im {
                  color: #222 !important;
                }
              </style>
            </head>
            <body>
              <table>
                <tr style="padding-bottom: 100px;">
                  <td colspan="3" width="411" height="124" style="text-align: center;">
                    <img src="https://taimuihongsg.com/wp-content/uploads/2023/10/logo-new_taimuihongsg.jpg" />
                  </td>
                </tr>
                <tr style="padding-bottom: 100px;">
                  <td colspan="3" class="im">
                    <h2 style="color: #222;">Kính gửi Quý khách hàng ${req.body.fullname ? req.body.fullname : ""}</h2>,
                    <span class="im">
                    <br />Đây là email nhắc đặt lịch hẹn từ Bệnh Viện Tai Mũi Họng Quốc Tế Sài Gòn và Hệ thống Đa Khoa Quốc Tế Sài Gòn về lịch khám sức khỏe của quý khách hàng trong năm nay.
                    </span>

                    <br />Để công ty chúng tôi có thể phục vụ quý khách tốt hơn, 
                    kính mong quý khác tiến hành bổ sung thông tin đặt hẹn 
                    ở đường link xác nhận đặt lịch khám sức khỏe qua link này: 
                    ${process.env.DOMAIN_SERVER}/${shortUrl}
                    <br />
                    <span  style="color: #222;">Nếu quý khách đã điền lịch khám thì vui lòng bỏ qua email này.
                    </span>
                    <br />
                    <span class="im">Quý khách vui lòng truy cập vào link để chọn lịch 
                    hoặc điều chỉnh lịch khám nếu có thay đổi. 
                    Trường hợp khẩn cấp vui lòng gọi đến số 
                    hotline của chúng tôi 02838213456 hoặc liên hệ trực tiếp 
                    với nhân viên kinh doanh phụ trách.
                    </span>
                    <span class="im">
                    <br />Xin cảm ơn quý khách hàng.
                    </span>
                    <br />
                    <span class="im">
                    Kính gửi,
                    </span>

                    <br />
                    <span class="im">
                      Bệnh Viện Tai Mũi Họng Quốc Tế Sài Gòn và Hệ thống Đa Khoa Quốc Tế Sài Gòn
                    </span>
                    <br />
                    <span class="im">
                      Website: taimuihongsg.com
                    </span>
                    <br />
                    <span class="im">Số điện thoại: 02838213456</span>
                    <br />
                    <span class="im">
                    Địa chỉ: 1-3, 6-8, 9-11-13-15 Trịnh Văn Cấn Phường Cầu Ông Lãnh, Quận 1, Thành phố Hồ Chí Minh
                    </span>
                  </td>
                </tr>
                <tr>
                  <td colspan="3">
                    <hr style="color: #cccccc;" />
                  </td>
                </tr>
                <tr>
                  <td style="width: 40%">
                    <span style="color: #cccccc;">CÔNG TY TNHH BỆNH VIỆN ĐA KHOA QUỐC TẾ SÀI GÒN</span>
                  </td>
                  <td style="width: 20%">
                  </td>
                  <td style="width: 40%;">
                    <div style="color: #222;">
                      GĐ Tài chính - Kinh doanh<br/>
                      <img src="https://crm.pavietnam.vn/resources/upload/newsletter/4267/8b69f4c78bb525eb7ca4_16-04-2024_1713254723.jpg" alt="Image">
                    </div>
                  </td>
                </tr>
              </table>
            </body>
            </html>`,
          };
          // Gửi email
          const info = await transporter.sendMail(mailOptions);
          console.log('Email đã được gửi:', info.response);
        }
      })
      .catch(error => {
        console.error(error)
        console.log('shortlink lưu vào csdl không thành công!');
      });



    try {
      if (!res.headersSent) {
        res.status(200).json({
          success: true,
          short_url: `${process.env.DOMAIN_SERVER}/${shortUrl}`,
          original_url: `${process.env.DOMAIN_WEB}/clients/choose_appointment/?token=${ToKen}`,
          is_saved_link
        });
      }
    } catch (error) {
      console.error('Lỗi khi gửi email:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    }
  }
};
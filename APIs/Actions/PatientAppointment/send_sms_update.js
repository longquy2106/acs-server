// server/APIs/login.js
const express = require('express');
const { request, gql } = require('graphql-request');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const axios = require('axios');
const moment = require('moment');
const crypto = require('crypto');
require('dotenv').config();
const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
const app = express();
app.use(express.json());
// Tạo một transporter với tài khoản Gmail của người gửi

module.exports = async function (req, res) {
  console.log('before body SMS');

  function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
  }
  let response = {
    sms_now: false,
    sms_delay: false,
    zns_now: false,
    short_url: ''
  }
  if (req.body) {
    console.log('have body SMS', req.body);
    const phone_number = req.body?.phone_number
    const request_id = req.body?.request_id
    const date = req.body?.date
    const bodyReq = req.body
    let dateToCompare = ''
    console.log('date', date);
    console.log('phone_number', phone_number);
    // Truy cập biến urlMap từ request object
    console.log('req.urlMap', req.urlMap);
    let urlMap = req.urlMap;

    // Thực hiện xử lý SMS request ở đây
    // ...

    // Thực hiện thay đổi trực tiếp vào urlMap
    let patients_ = {}
    if (phone_number && request_id) {
      console.log('have phone number');
      let ToKen = null
      let shortUrlQuery = ''
      const dateQuery = gql`
      query MyQuery {
        his_ace_patients(where: {id: {_eq: "${request_id}"}}) {
          id
          medical_code
          phone_number
          fullname
          nationality
          company_service_pack {
            appointment_company_service_packs(limit: 1, order_by: {appointment_session: {appointment_schedule: {date: asc}}}) {
              appointment_session {
                appointment_schedule {
                  date
                }
              }
            }
          }
          shortlink {
            id
            short_url
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
            patients_ = results.his_ace_patients[0]
            const dateString = results.his_ace_patients[0]?.company_service_pack?.appointment_company_service_packs[0]
              ?.appointment_session?.appointment_schedule?.date
            // Chuyển đổi biến ngày sang đối tượng Date
            dateToCompare = new Date(dateString);

            dateToCompare.setDate(dateToCompare.getDate() - 4);
            const dateToCompare_with_today = new Date(dateString);
            dateToCompare_with_today.setDate(dateToCompare.getDate() + 1);
            // Lấy ngày hiện tại
            const today = new Date();

            // So sánh ngày hiện tại với biến ngày
            if (today < dateToCompare_with_today) {
              // Nếu ngày hiện tại bé hơn biến ngày, tính hiệu của hai ngày và lấy giá trị tuyệt đối
              const differenceInTime = Math.abs(dateToCompare.getTime() - today.getTime());
              // Chuyển đổi kết quả thành số ngày (tính theo milliseconds)
              const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
              console.log('Hiệu của hai ngày là:', differenceInDays, 'ngày');
              ToKen = jwt.sign({
                phone_number: phone_number,
                id: request_id
              },
                process.env.SECRET_KEY,
                {
                  expiresIn: `${differenceInDays} days`
                });
            } else {
              // Ngược lại, bỏ qua
              console.log('Ngày hiện tại lớn hơn hoặc bằng ngày cần so sánh.');
            }
          }
          if (results.his_ace_patients[0]?.shortlink?.short_url) {
            shortUrlQuery = results.his_ace_patients[0].shortlink.short_url
            console.log('có sắn short_url', shortUrlQuery);
          }
        })
        .catch(error => {
          console.error(error)
          console.log('shortlink lưu vào csdl không thành công!');
          res.json({ success: false, sms_now: response.sms_now, zns_now: response.zns_now, sms_delay: response.sms_delay, short_url: response.short_url });
        });
      console.log('ToKen', ToKen);

      function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      async function APIS_SMS(shortUrl) {
        // is_saved_link = true;

        let isSMSSent = false;

        // sms zalo
        await delay(2000);
        try {
          console.log('Bắt đầu gửi zalo!');

          const results = await axios.post(
            `http://rest.esms.vn/MainService.svc/json/SendZaloMessage_V4_post_json/`,
            {
              ApiKey: "C671FB9BF15391FA5FFC62A3AC9A34",
              SecretKey: "D3C47022E82732DD589C9E2AC56742",
              Phone: phone_number,
              Params: [
                `${patients_?.fullname ? patients_.fullname : 'no_name'}`, // Tên bệnh nhân
                `${patients_?.medical_code ? patients_.medical_code : `${generateRandomString(8)}`}`, // Mã bệnh nhân
                `${bodyReq.date ? bodyReq.date : 'Chưa đặt lịch'}`, // Ngày hẹn khám
                `${bodyReq.shift ? bodyReq.shift : 'Chưa đặt lịch'}`, // Thời điểm hẹn khám
                `${dateToCompare ? `${dateToCompare.getDate()}-${dateToCompare.getMonth() + 1}-${dateToCompare.getFullYear()}` : ''}`,
                `${shortUrl}`],
              TempID: patients_?.nationality === 'VNM' ? '390079' : '390084',
              OAID: "4078149538948946926",
              Sandbox: 0,
              RequestId: `${request_id}${generateRandomString(10)}`,
              campaignid: "zalodkqtsg",
              // CallbackUrl: `${process.env.DOMAIN_SERVER}/result-zalo`
              CallbackUrl: `${process.env.DOMAIN_SERVER}/result-zalo?patient_id=${request_id
                }&shift=${bodyReq.shift ? bodyReq.shift : 'null'
                }&date=${bodyReq.date ? bodyReq.date : 'null'
                }&dateToCompare=${dateToCompare ? dateToCompare : 'null'
                }&phone_number=${phone_number
                }&shortUrl=${shortUrl ? shortUrl : 'null'
                }&type=zalo`
            }
          );
          if (results?.data?.CodeResult && results.data.CodeResult === '100') {
            console.log("sent zalo success");
            isSMSSent = true;
            response.zns_now = true
            response.short_url = `${process.env.DOMAIN_SERVER} / ${shortUrl}`
            // await updateSentStatus(request_id)
          } else {
            if (results) {
              console.log('results', results);
            }
            console.log("sent zalo false");
          }
          // thực hiện gửi sms delay tại đây
        } catch (error) {
          console.log("error in send sms", error);
        }

        // console.log('send SMS success');
        res.json({ success: isSMSSent, sms_now: response.sms_now, zns_now: response.zns_now, sms_delay: response.sms_delay, short_url: response.short_url });
      }
      const originalUrl = `${process.env.DOMAIN_WEB}/clients/choose_appointment/?token=${ToKen}`;
      let shortUrl = shortid.generate();
      urlMap[shortUrl] = originalUrl;
      console.log('req.urlMap after add', req.urlMap);
      if (!req.body?.short_url && !shortUrlQuery) {
        console.log('chưa có short_url');
        const insert = gql`
            mutation MyMutation($objects: [his_ace_shortlinks_insert_input!] = {short_url: "${shortUrl}", original_url: "${originalUrl}", id_patient: "${request_id}"}) {
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
        await request(endpoint, insert, variables, headers)
          .then(async function (data) {
            console.log(data)
            // kiểm tra có dữ liệu đã insert hay không
            if (data.insert_his_ace_shortlinks?.affected_rows) {
              console.log('Lưu shortlink vào csdl thành công!');
              await APIS_SMS(shortUrl)
            }
          })
          .catch(error => {
            console.error(error)
            console.log('shortlink lưu vào csdl không thành công!');
            if (!res.headersSent) {
              // Chỉ gửi phản hồi nếu header chưa được gửi đi
              res.json({ success: false, sms_now: response.sms_now, zns_now: response.zns_now, sms_delay: response.sms_delay, short_url: response.short_url });
            }
            return; // Dừng hàm ở đây
          });
      } else {
        // Sử dụng phương thức split() để tách chuỗi bằng dấu '/'
        if (shortUrlQuery) {
          shortUrl = shortUrlQuery
          console.log('có short_url shortUrlQuery', shortUrlQuery);
        } else if (req.body?.short_url) {
          const segments = req.body.short_url.split('/')
          // Lấy phần cuối cùng của chuỗi
          shortUrl = segments.length ? segments[segments.length - 1] : '';
          console.log('có short_url shortUrl', shortUrl);
        } else {
          shortUrl = null
          console.log('short_url null');
        }
        urlMap[shortUrl] = originalUrl;
        await APIS_SMS(shortUrl)
      }
    }
  } else {
    console.log('send SMS error');
    if (!res.headersSent) {
      res.json({ success: isSMSSent, sms_now: response.sms_now, zns_now: response.zns_now, sms_delay: response.sms_delay, short_url: response.short_url });
    }
  }

};
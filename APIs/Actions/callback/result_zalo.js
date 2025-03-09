const { request, gql } = require('graphql-request');
const axios = require('axios');
require('dotenv').config();
const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
module.exports = async function (req, res) {
  function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
  }

  // cập nhật trạng thái gửi thành 1 (Đã gửi Zalo)
  async function updateSentStatus(patient_id) {
    const dateQuery = gql`
        mutation MyMutation {
          update_his_ace_patients(where: {id: {_eq: "${patient_id}"}}, _set: {is_mess_sent: 2}) {
            affected_rows
            returning {
              id
            }
          }
        }
        `
    const dateVariables = {
    };
    let is_sent = false
    await request(endpoint, dateQuery, dateVariables, headers)
      .then(async function (results) {
        if (results?.update_his_ace_patients?.affected_rows > 0) {
          console.log('Cập nhật trạng thái đã sửi sms thành công!');
          is_sent = true
        } else {
          is_sent = false
        }
      })
      .catch(err => {
        console.log('Không thể update trạng thái đã gửi sms', err);
        is_sent = false
      })
    return is_sent
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // cập nhật trạng thái nhận thành 1 (Đã nhận)
  async function updateSuccessStatus(patient_id) {
    const dateQuery = gql`
        mutation MyMutation {
          update_his_ace_patients(where: {id: {_eq: "${patient_id}"}}, _set: {is_mess_success: 1}) {
            affected_rows
            returning {
              id
            }
          }
        }
        `
    const dateVariables = {
    };
    await request(endpoint, dateQuery, dateVariables, headers)
      .then(async function (results) {
        if (results?.update_his_ace_patients?.affected_rows > 0) {
          return true
        } else {
          return false
        }
      })
      .catch(err => {
        console.log('Không thể update trạng thái đã nhận', err);
        return false
      })
    return false
  }
  try {
    // Thực hiện xử lý dữ liệu callback
    if (req?.query) {
      console.log('callback: req.query:', req.query);
      if (req.query.SendSuccess && req.query.SendSuccess > 0 &&
        req.query.patient_id) {
        // Đã nhận thành công
        console.log('Tiến hành cập nhật trạng thái đã nhận tin!');
        if (updateSuccessStatus(req.query.patient_id)) {
          if (!res.headersSent) {
            console.log('Đã cập nhật trạng thái đã nhận tin!');
            res.status(200).send('Đã cập nhật trạng thái đã nhận tin!');
          }
        } else {
          if (!res.headersSent) {
            console.log('Không thể cập nhật trạng thái đã nhận tin!');
            res.status(200).send('Không thể cập nhật trạng thái đã nhận tin!');
          }
        }
      }
      // Chưa gửi thành công -> Gửi sms
      else if (
        req.query.patient_id && req.query.type === 'zalo') {
        // Gửi SMS
        await delay(1000);
        try {
          const results = await axios.post(
            `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/`,
            {
              Content: `Lịch khám tại DKQTSG:\n` +
                `Your health check-up appointment at SIGC:\n` +
                `Ngày khám/ Date: ${req.query.date && req.query.date !== 'null' ? req.query.date : 'Chưa đặt lịch'}\n` +
                `Giờ khám/ Time: ${req.query.shift && req.query.shift !== 'null' ? req.query.shift : 'Chưa đặt lịch'}\n` +
                `Nếu muốn thay đổi thông tin, xin vui lòng truy cập link:\n` +
                `If you wish to change this info, please access the link:\n` +
                `${process.env.DOMAIN_SERVER}/${req.query.shortUrl && req.query.shortUrl !== 'null' ? req.query.shortUrl : null} .\n` +
                // `${dateToCompare ? `Hạn chót điều chỉnh/ Last editable day: 07-11-3000.\n` : ''}` +
                `${req.query.dateToCompare && req.query.dateToCompare != 'null' ? `Hạn chót điều chỉnh/ Last editable day: ${new Date(req.query.dateToCompare).getDate()
                  }-${new Date(req.query.dateToCompare).getMonth() + 1
                  }-${new Date(req.query.dateToCompare).getFullYear()}.\n` : ''}` +
                `Xin cảm ơn quý khách.\n` +
                `Thanks for your time.`,
              Phone: req.query.phone_number,
              ApiKey: "C671FB9BF15391FA5FFC62A3AC9A34",
              SecretKey: "D3C47022E82732DD589C9E2AC56742",
              Brandname: "DKQT.SAIGON",
              SmsType: "2",
              IsUnicode: 1,
              Sandbox: 0,
              campaignid: "ksk dathen",
              RequestId: `${req.query.patient_id}${generateRandomString(6)}`,
              CallbackUrl: `${process.env.DOMAIN_SERVER}/result-zalo?patient_id=${req.query.patient_id}`
            }
          );
          console.log('results', results);

          if (results?.data?.CodeResult && results.data.CodeResult === '100') {
            // Gửi sms thành công
            if (await updateSentStatus(req.query.patient_id)) {
              if (!res.headersSent) {
                console.log('Cập nhật đã gửi sms thành công!');
                res.status(200).send('Cập nhật đã gửi sms thành công!');
              }
            } else {
              if (!res.headersSent) {
                console.log('Cập nhật đã gửi sms không thành công!');
                res.status(200).send('Cập nhật đã gửi sms không thành công!');
              }
            }
          } else {
            if (!res.headersSent) {
              console.log("Gửi sms không thành công!");
              res.status(200).send('Gửi sms không thành công!');
            }
          }
        } catch (error) {
          if (!res.headersSent) {
            console.log("Lỗi khi gửi sms!", error);
            res.status(200).send('Lỗi khi gửi sms!');
          }
        }
      } else {
        if (!res.headersSent) {
          console.log("Gửi tin không thành công, không đủ param từ callback zalo hoặc sms!");
          res.status(200).send('Gửi tin không thành công, không đủ param từ callback zalo hoặc sms!');
        }
      }
    }
  } catch (error) {
    if (!res.headersSent) {
      console.log('Gọi call back không thành công!', error);
      res.status(500).send('Gọi call back không thành công!');
    }
  }
  if (!res.headersSent) {
    console.log('Không có thao tác trong callback!');
    res.status(200).send('Không có thao tác trong callback!');
  }
};
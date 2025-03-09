// server/APIs/login.js
const express = require('express');
const client = require('../../../ConnectDatabase/his_ace')
const { request, gql } = require('graphql-request');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
require('dotenv').config();
const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
const app = express();
app.use(express.json());

module.exports = async function () {
  let dateToCompare = ''
  function DataDateToValDate(date) {
    let strDate = date;
    let dateConverted = "";
    try {
      if (strDate && strDate.includes("-")) {
        const [yyyy, mm, dd] = strDate.split("-");
        dateConverted = `${dd}-${mm}-${yyyy}`;
      } else if (strDate && strDate.includes("/")) {
        const [yyyy, mm, dd] = strDate.split("/");
        dateConverted = `${dd}-${mm}-${yyyy}`;
      }
    } catch (error) {
      // 
    }
    return dateConverted;
  }
  function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      randomString += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return randomString;
  }
  // Tạo một đối tượng Date đại diện cho ngày hôm nay
  const today = new Date();

  // Cộng thêm 3 ngày vào ngày hiện tại
  today.setDate(today.getDate() + 4);
  // Lấy ngày, tháng và năm từ đối tượng Date
  const year = today.getFullYear();
  // Lưu ý: Phương thức getMonth trả về tháng từ 0 đến 11, nên cần cộng thêm 1
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  // Định dạng ngày theo yêu cầu 'YYYY-MM-DD'
  const formattedDate = `${year}-${month}-${day}`;
  console.log('formattedDate', formattedDate);
  const shift = [
    {
      id: 1,
      time: '07:30 - 09:00',
    },
    {
      id: 2,
      time: '09:00 - 10:30',
    },
    {
      id: 3,
      time: '13:00 - 14:00',
    },
    {
      id: 4,
      time: '14:00 - 15:30',
    },
  ]
  const listSendSMS = []
  // Câu lệnh truy vấn
  let query =
    `query MyQuery {
      his_ace_company_service_packs(order_by: {id: desc}, where: {appointment_company_service_packs: {appointment_session: {appointment_schedule: {date: {_eq: "${formattedDate}"}}}}}) {
        id
        patients {
          id
          email
          phone_number
          fullname
          medical_code
          shortlink {
            id
            short_url
          }
          appointment_session {
            id
            name
            appointment_schedule {
              id
              date
            }
          }
        }
        appointment_company_service_packs(order_by: {appointment_session: {appointment_schedule: {date: asc}}}, limit: 1) {
          appointment_session {
            name
            appointment_schedule {
              date
              id
            }
            id
          }
          id
        }
      }
    }    
    `
  console.log('query', query);
  var variables = {
  }
  await client.query(
    query,
    variables,
    function (req, res) {
      // callback trả về kết quả hoặc nếu có lỗi diễn ra
      if (res.status === 401)
        throw new Error('Not authorized')
    }).then(function (body) {
      console.log('body.data', body.data);
      if (body.data?.his_ace_company_service_packs.length > 0) {
        console.log('ok his com pack');
        const dataPacks = body.data?.his_ace_company_service_packs
        for (let index = 0; index < dataPacks.length; index++) {
          console.log('ok dataPack len', dataPacks[index]?.appointment_company_service_packs);
          if (dataPacks[index]?.appointment_company_service_packs[0]
            ?.appointment_session?.appointment_schedule?.date?.toString() === formattedDate &&
            dataPacks[index].patients.length > 0) {
            console.log('ok compare date');
            const patientPacks = dataPacks[index].patients
            for (let j = 0; j < patientPacks.length; j++) {
              patientPacks[j].dateLimit = dataPacks[index].appointment_company_service_packs[0]
                .appointment_session.appointment_schedule.date
              console.log('ok patientPack len');
              listSendSMS.push(patientPacks[j])
            }
          }
        }
        console.log(listSendSMS);
      }
      // hoạt động khi toàn bộ hàm đã thực hiện xong... Thường để nhận về kết quả mong muốn cuối cùng (có thể viết hàm trả về cho client ở đây...)
    }).catch(function (err) {
      console.log(err.message)
    })
  console.log('before body SMS');
  for (let index = 0; index < listSendSMS.length; index++) {

    const phone_number = listSendSMS[index]?.phone_number
    const fullname = listSendSMS[index]?.fullname
    const medical_code = listSendSMS[index]?.medical_code
    const request_id = listSendSMS[index]?.id
    const shortUrl = listSendSMS[index]?.shortlink?.short_url
    const timeAppointment = shift[(listSendSMS[index]?.appointment_session?.name ? listSendSMS[index]?.appointment_session?.name : 0) - 1]?.time;
    const dateAppointment = listSendSMS[index]?.appointment_session?.appointment_schedule?.date;
    dateToCompare = new Date(listSendSMS[index].dateLimit)
    dateToCompare.setDate(dateToCompare.getDate() - 4)
    if (phone_number) {
      // Thực hiện thay đổi trực tiếp vào urlMap
      if (phone_number && request_id) {
        console.log('phone_number', phone_number);
        function delay(ms) {
          return new Promise(resolve => setTimeout(resolve, ms));
        }
        let isSMSSent = false
        console.log('dateToCompare', dateToCompare);
        await delay(1000);

        // gửi zalo
        try {
          console.log('Bắt đầu gửi zalo!');

          const results = await axios.post(
            `http://rest.esms.vn/MainService.svc/json/SendZaloMessage_V4_post_json/`,
            {
              ApiKey: "C671FB9BF15391FA5FFC62A3AC9A34",
              SecretKey: "D3C47022E82732DD589C9E2AC56742",
              Phone: phone_number,
              Params: [
                `${fullname ? fullname : 'noname'}`, // Tên bệnh nhân
                `${medical_code ? medical_code : `${generateRandomString(8)}`}`, // Mã bệnh nhân
                `${dateAppointment ? DataDateToValDate(dateAppointment) : 'Chưa đặt lịch'}`, // Ngày hẹn khám
                `${timeAppointment ? timeAppointment : 'Chưa đặt lịch'}`, // Thời điểm hẹn khám
                `${dateToCompare ? `${dateToCompare.getDate()}-${dateToCompare.getMonth() + 1}-${dateToCompare.getFullYear()}` : ''}`,
                `${shortUrl}`],
              TempID: patients_?.nationality === 'VNM' ? '390079' : '390084',
              OAID: "4078149538948946926",
              Sandbox: 0,
              RequestId: `${request_id}${generateRandomString(10)}`,
              campaignid: "zalodkqtsg",
              // CallbackUrl: `${process.env.DOMAIN_SERVER}/result-zalo`
              CallbackUrl: `${process.env.DOMAIN_SERVER}?patient_id=${request_id
                }&shift=${timeAppointment ? timeAppointment : 'null'
                }&date=${dateAppointment ? DataDateToValDate(dateAppointment) : 'null'
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

        // try {
        //   const results = await axios.post(
        //     `http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/`,
        //     {
        //       Content: `Lịch khám tại DKQTSG:` + '\n' +
        //         `Your health check-up appointment at SIGC:` + '\n' +
        //         `Ngày khám/ Date: ${dateAppointment ? DataDateToValDate(dateAppointment) : 'Chưa đặt lịch'}` + '\n' +
        //         `Giờ khám/ Time: ${timeAppointment ? timeAppointment : 'Chưa đặt lịch'}\n` +
        //         `Nếu muốn thay đổi thông tin, xin vui lòng truy cập link:\n` +
        //         `If you wish to change this info, please access the link:\n` +
        //         `${process.env.DOMAIN_SERVER}/${shortUrl} .\n` +
        //         `${dateToCompare
        //           ? `Hạn chót điều chỉnh/ Last editable day: ${dateToCompare.getDate()}-${dateToCompare.getMonth() + 1}-${dateToCompare.getFullYear()}.\n` : ''}` +
        //         `Xin cảm ơn quý khách.\n` +
        //         `Thanks for your time.`,
        //       Phone: phone_number,
        //       ApiKey: "C671FB9BF15391FA5FFC62A3AC9A34",
        //       SecretKey: "D3C47022E82732DD589C9E2AC56742",
        //       Brandname: "DKQT.SAIGON",
        //       SmsType: "2",
        //       IsUnicode: 1,
        //       Sandbox: 0,
        //       campaignid: "abc",
        //       RequestId: `${request_id}${generateRandomString(6)}`,
        //       //    "CallbackUrl": "CallbackUrl"
        //     }
        //   );
        //   if (results) {
        //     console.log("results", results?.headers?.date ? results.headers.date : '');
        //     isSMSSent = true;
        //     const updateIsSent = gql`
        //       mutation MyMutation {
        //         update_his_ace_patients(where: {id: {_eq: "${request_id}"}}, _set: {is_mess_sent: 1}) {
        //           affected_rows
        //           returning {
        //             id
        //           }
        //         }
        //       }
        //     `;
        //     // console.log('insert his_ace_shortlinks_insert_input', updateIsSent);
        //     const variables = {
        //     };
        //     await request(endpoint, updateIsSent, variables, headers)
        //       .then(async function (data) {
        //         console.log(data)
        //         // kiểm tra có dữ liệu đã insert hay không
        //         if (data.update_his_ace_patients?.affected_rows) {
        //           console.log('Đã cập nhật trạng thái đã gửi!');
        //         } else {
        //           console.log('Cập nhật trạng thái đã gửi không thành công!');
        //         }
        //       })
        //       .catch(error => {
        //         console.error(error)
        //         console.log('Lỗi cập nhật trạng thái gửi tin nhắn!');
        //         res.json({ success: isSMSSent, updateStatus: false });
        //       });
        //   } else {
        //     console.log("false");
        //   }
        // } catch (error) {
        //   console.log("error in send sms", error);
        // }

        if (isSMSSent === true) {
          console.log('send SMS success');
        }
      }
    }
  }
  if (!res.headersSent) {
    console.log('Không có thao tác trong sms_due_up!');
    res.status(200).send('Không có thao tác trong sms_due_up!');
  }
};
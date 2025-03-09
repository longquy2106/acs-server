// server/APIs/login.js
const express = require('express');
const { request, gql } = require('graphql-request');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();
const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
require('dotenv').config();
const app = express();
app.use(express.json());
// Tạo một transporter với tài khoản Gmail của người gửi

module.exports = async function (req, res) {
  function customStringify(obj, replacer, spaces) {
    const stringify = (key, value) => {
      if (replacer) {
        return replacer(key, value);
      }

      // Nếu giá trị là một đối tượng và không phải là mảng, không thêm nháy kép cho khóa
      if (typeof value === 'object' && !Array.isArray(value)) {
        if (value !== null) {
          return `{${Object.keys(value).map(k => `${k}:${stringify(k, value[k])}`).join(',')}}`;
        }
      }

      // Sử dụng JSON.stringify cho tất cả các giá trị khác
      return JSON.stringify(value);
    };

    return JSON.stringify(obj, stringify, spaces);
  }

  // console.log('req.body?.variables', req.body?.variables);
  if (req.body?.variables) {
    console.log('req.body?.variables', req.body?.variables);

    const tempObjects = req.body?.variables
    const jsonObjects = []
    for (let index = 0; index < tempObjects.length; index++) {
      const tempObject = {
        company_id: tempObjects[index].company_id,
        email: tempObjects[index].email ? tempObjects[index].email : null,
        fullname: tempObjects[index].fullname,
        company_service_pack_id: tempObjects[index].package_id,
        phone_number: tempObjects[index].phone_number,
        birthday: tempObjects[index].birthday
      }

      // Định dạng lại ngày-tháng-năm thành năm-tháng-ngày để lưu vào database
      // if (Number.isInteger(Number(tempObjects[index].birthday))) {
      //   const [dd, mm, yyyy] = new Date(tempObjects[index].birthday).toISOString().split('T')[0].split('-')
      //   const dateObject = new Date(`${yyyy}-${mm}-${dd}`)
      //   tempObject.birthday = dateObject.toISOString().split('T')[0]
      // } else if (tempObjects[index].birthday.includes('-')) {
      //   const [dd, mm, yyyy] = tempObjects[index].birthday.split('-')
      //   const dateObject = new Date(`${yyyy}-${mm}-${dd}`)
      //   tempObject.birthday = dateObject.toISOString().split('T')[0]
      // } else if (tempObjects[index].birthday.includes('/')) {
      //   const [dd, mm, yyyy] = tempObjects[index].birthday.split('/')
      //   const dateObject = new Date(`${yyyy}-${mm}-${dd}`)
      //   tempObject.birthday = dateObject.toISOString().split('T')[0]
      // }

      if (tempObjects[index].session_id) {
        tempObject.appointment_session_id = tempObjects[index].session_id
      }
      jsonObjects.push(tempObject)
    }
    console.log('objects', jsonObjects);

    // Câu lệnh truy vấn
    let objects = '['
    for (let index = 0; index < jsonObjects.length; index++) {
      objects += customStringify(jsonObjects[index], null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}')
      if (index < jsonObjects.length - 1) {
        objects += ','
      }
    }
    objects += ']'
    console.log('objects', objects);
    let insert = ""
    if (jsonObjects.length === 1) {
      insert = gql`
      mutation MyMutation($objects: [his_ace_patients_insert_input!]! = ${objects}) {
        insert_his_ace_patients(objects: $objects) {
          affected_rows
          returning {
            id
            email
            fullname
            phone_number
            company_service_pack {
              appointment_company_service_packs(limit: 1, order_by: {appointment_session: {appointment_schedule: {date: asc}}}) {
                appointment_session {
                  id
                  appointment_schedule {
                    id
                    date
                  }
                }
                id
              }
              id
            }
          }
        }
      }
    `;
    } else if (jsonObjects.length > 1) {
      insert = gql`
      mutation MyMutation($objects: [his_ace_patients_insert_input!] = ${objects}) {
        insert_his_ace_patients(objects: $objects) {
          affected_rows
          returning {
            id
            email
            fullname
            phone_number
            company_service_pack {
              appointment_company_service_packs(limit: 1, order_by: {appointment_session: {appointment_schedule: {date: asc}}}) {
                appointment_session {
                  id
                  appointment_schedule {
                    id
                    date
                  }
                }
                id
              }
              id
            }
          }
        }
      }
    `;
    }

    console.log('insert', insert);

    const variables = {
    };
    request(endpoint, insert, variables, headers)
      .then(async function (data) {
        console.log(data)
        if (data.insert_his_ace_patients?.returning?.length > 0) {
          // const returning = data.insert_his_ace_patients?.returning
          // for (index = 0; index < returning.length; index++) {
          //   if (returning[index].email) {

          //     const ToKen = jwt.sign({
          //       email: returning[index].email
          //     },
          //       process.env.SECRET_KEY,
          //       {
          //         expiresIn: "3 days"
          //       });
          //     console.log('ToKen', ToKen);

          //     const transporter = nodemailer.createTransport({
          //       service: 'gmail',
          //       auth: {
          //         user: 'caochithuongfk1@gmail.com',
          //         pass: 'wyxd ohjq yumt nmme',
          //       },
          //     });

          //     // Thông tin về email muốn gửi
          //     const mailOptions = {
          //       from: 'caochithuongfk1@gmail.com',
          //       to: returning[index].email,
          //       subject: 'Chủ đề của email',
          //       text: "Nội dung của email:\n"
          //         + `http://localhost:3000/clients/choose_appointment/?token=${ToKen}`,
          //     };

          //     try {
          //       const info = await transporter.sendMail(mailOptions);
          //       console.log('Email đã được gửi:', info.response);
          //     } catch (error) {
          //       console.error('Lỗi khi gửi email:', error);
          //       res.status(500).json({ success: false, error: 'Internal Server Error' });
          //     }
          //   }
          // }
          res.status(200).json({ data });
        }
      })
      .catch(error => {
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' });
      });
  } else {
  }
};
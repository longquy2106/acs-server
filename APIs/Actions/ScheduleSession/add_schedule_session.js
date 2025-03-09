// server/APIs/login.js
const { query } = require('express');
const { request, gql } = require('graphql-request');
require('dotenv').config();

const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
  'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};
require('dotenv').config();
module.exports = function (req, res) {
  // console.log('req.body.package_add', req.body.package_add);
  // console.log('req.body.package_add.session_packs', req.body.package_add.session_packs);
  function customStringify(obj, replacer, spaces) {
    const stringify = (key, value) => {
      if (replacer) {
        return replacer(key, value);
      }

      // Nếu giá trị là một đối tượng và không phải là mảng, không thêm nháy kép cho khóa
      if (typeof value === 'object' && !Array.isArray(value)) {
        return `{${Object.keys(value).map(k => `${k}:${stringify(k, value[k])}`).join(',')}}`;
      }

      // Sử dụng JSON.stringify cho tất cả các giá trị khác
      return JSON.stringify(value);
    };

    return JSON.stringify(obj, stringify, spaces);
  }
  if (req.body?.variables) {
    console.log('req.body?.variables', req.body?.variables);
    let tempObjects = req.body?.variables

    for (index = 0; index < tempObjects.length; index++) {

      // Định dạng lại ngày-tháng-năm thành năm-tháng-ngày để lưu vào database
      if (Number.isInteger(Number(tempObjects[index].date))) {
        const [dd, mm, yyyy] = new Date(tempObjects[index].date).toISOString().split('T')[0].split('-')
        const dateObject = new Date(`${yyyy}-${mm}-${dd}`)
        tempObjects[index].date = dateObject.toISOString().split('T')[0]
      } else if (tempObjects[index].date.includes('-')) {
        const [dd, mm, yyyy] = tempObjects[index].date.split('-')
        const dateObject = `${yyyy}-${mm}-${dd}`;
        tempObjects[index].date = dateObject
      } else if (tempObjects[index].date.includes('/')) {
        const [dd, mm, yyyy] = tempObjects[index].date.split('/')
        const dateObject = `${yyyy}-${mm}-${dd}`;
        tempObjects[index].date = dateObject
      }

      if (tempObjects[index].appointment_sessions?.data?.length > 0) {
        console.log('tempObjects[index].appointment_sessions', tempObjects[index].appointment_sessions.data);
        const tempDatasJson = tempObjects[index].appointment_sessions.data
        let tempDatas = '['
        for (let index2 = 0; index2 < tempDatasJson.length; index2++) {
          tempDatas += customStringify(tempDatasJson[index2], null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}')
          if (tempDatas < tempDatasJson.length - 1) {
            tempDatas += ','
          }
        }
        tempDatas += ']'

        tempObjects[index].appointment_sessions.data = tempDatas
      }
    }
    let objects = '['
    for (let index = 0; index < tempObjects.length; index++) {
      objects += customStringify(tempObjects[index], null, 2).replace(/\\/g, '').replace(/"{/g, '{').replace(/}"/g, '}').replace(/"\[/g, '[').replace(/\]"/g, ']')
      if (index < tempObjects.length - 1) {
        objects += ','
      }
    }
    objects += ']'
    console.log('objects', objects);

    // Câu lệnh truy vấn
    const insert = gql`
      mutation MyMutation($objects: [his_ace_appointment_schedules_insert_input!]! = ${objects}) {
      insert_his_ace_appointment_schedules(objects: $objects) {
        affected_rows
        returning {
          id
          appointment_sessions {
            id
          }
        }
      }
    }
    `;
    console.log('insert', insert);

    const variables = {

    };
    request(endpoint, insert, variables, headers)
      .then(function (data) {
        console.log(data)
        res.json(data)
      })
      .catch(error => console.error(error));
  } else {
  }
};
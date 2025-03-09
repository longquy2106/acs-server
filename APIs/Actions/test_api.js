// server/APIs/login.js
const express = require('express');
const { request, gql } = require('graphql-request');
const axios = require('axios');
require('dotenv').config();
const e = require("express");
const querystring = require('querystring');

module.exports = async function (req, res) {
  try {
    const url = 'https://crm.pavietnam.vn/api/email-marketing/list-template';
    const data = {
      action: "list_template",
      token: "86dfbc42e7215abaea129a435536f9b6",
      username: "saigonen660e"
    };

    const formData = querystring.stringify(data);

    axios.post(url, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
      .then(function (response) {
        console.log('Response:', response.data);
      })
      .catch(function (error) {
        console.error('Error:', error);
      });
  } catch (error) {
    console.log('test fail', error);
  }
};
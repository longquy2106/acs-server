const { query } = require('express');
const { request, gql } = require('graphql-request');
require('dotenv').config();
const endpoint = process.env.ENDPOINT_HASURA;
const headers = {
    'x-hasura-admin-secret': process.env.X_HASURA_ADMIN_SECRET, // hoặc 'x-hasura-access-key': 'your-access-key'
};

const fs = require('fs'); // Import the fs module
module.exports = function (req, res) {
    console.log('req.body', req.body);
    if (req.body?.company_id) {
        try {
            if (!req.file) {
                return res.status(800).send('No image uploaded.');
            }
            const base64String = req.file?.buffer?.toString('base64');
            console.log('req.file', req.file);
            const update = gql`mutation MyMutation {
                update_his_ace_companies(where: {id: {_eq: ${req.body?.company_id}}}, _set: {url_image: "${base64String}"}) {
                  affected_rows
                  returning {
                    id
                  }
                }
              }              
            `;
            console.log('update', update);
            const variables = {
            };
            request(endpoint, update, variables, headers)
                .then(function (data) {
                    console.log(data)
                    res.json(data)
                })
                .catch(error => {
                    console.error(error)
                    if (!res.headersSent) {
                        res.status(500).send('Lỗi query');
                    }
                });
        } catch (error) {
            console.error('Error uploading and saving image:', error);

            if (!res.headersSent) {
                res.status(500).send('Internal Server Error');
            }
        }
    } else {

        if (!res.headersSent) {
            res.status(500).send('Không có company_id');
        }
    }

}
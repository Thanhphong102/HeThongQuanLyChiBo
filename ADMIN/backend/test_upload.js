const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
  try {
    // 1. Login
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      ten_dang_nhap: 'xuanphong100204@gmail.com',
      mat_khau: 'Admin@123'
    });
    const token = loginRes.data.token;
    console.log('Login success!');

    // 2. Upload file to folder ID 2
    const form = new FormData();
    form.append('files', Buffer.from('hello world'), {filename: 'test.txt'});

    console.log('Uploading...');
    const uploadRes = await axios.post('http://localhost:5001/api/branch-forms/folders/2/upload', form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Upload success:', uploadRes.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}
run();

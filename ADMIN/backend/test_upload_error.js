const FormData = require('form-data');
const fs = require('fs');

async function run() {
  try {
    // 1. Login
    const loginRes = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ten_dang_nhap: 'xuanphong100204@gmail.com',
        mat_khau: 'Admin@123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('Login success!');

    const { FormData } = require('formdata-node');
    const { File } = require('formdata-node');
    
    const form = new FormData();
    form.append('files', new File(['hello world'], 'test.txt'));

    console.log('Uploading with explicitly set multipart/form-data...');
    const uploadRes = await fetch('http://localhost:5001/api/branch-forms/folders/2/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data' // Intentionally missing boundary
      },
      body: form
    });
    
    if (uploadRes.ok) {
        console.log('Upload success:', await uploadRes.json());
    } else {
        console.log('Upload error:', uploadRes.status, await uploadRes.text());
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();

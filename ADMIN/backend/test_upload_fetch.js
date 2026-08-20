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

    // 2. Upload file to folder ID 2
    const FormData = require('formdata-node').FormData || global.FormData;
    const { File } = require('formdata-node') || {};
    
    const form = new FormData();
    form.append('files', new Blob([Buffer.from('hello world')]), 'test.txt');

    console.log('Uploading...');
    const uploadRes = await fetch('http://localhost:5001/api/branch-forms/folders/2/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
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

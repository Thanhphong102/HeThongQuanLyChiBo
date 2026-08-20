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
    
    // 2. Fetch Notifications
    console.log('Fetching notifications...');
    const notifRes = await fetch('http://localhost:5001/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!notifRes.ok) {
        console.error('Notifications Error:', notifRes.status, await notifRes.text());
    } else {
        console.log('Notifications Success');
    }

    // 3. Upload File
    console.log('Uploading file...');
    const { FormData } = require('formdata-node') || {};
    if (FormData) {
        const form = new FormData();
        const { File } = require('formdata-node');
        form.append('files', new File(['test content'], 'test.txt'));
        const uploadRes = await fetch('http://localhost:5001/api/branch-forms/folders/2/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }, // fetch + formdata-node will set correct content-type if node-fetch supports it... actually native fetch might not like formdata-node.
            body: form
        });
        if (!uploadRes.ok) {
            console.error('Upload Error:', uploadRes.status, await uploadRes.text());
        } else {
            console.log('Upload Success');
        }
    }
  } catch (err) {
    console.error('Script Error:', err.message);
  }
}
run();

document.addEventListener("DOMContentLoaded", () => {
  fetch("../component/header.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("header-placeholder").innerHTML = data;
    });

  fetch("../component/footer.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("footer-placeholder").innerHTML = data;
    });
});

document.getElementById('config-form').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const data = {
      device_type: document.getElementById('device_type').value,
      config_name: document.getElementById('config_name').value,
      variables: {
        interface: document.getElementById('interface').value,
        vlan_id: document.getElementById('vlan_id').value,
        ip_address: document.getElementById('ip_address').value,
        subnet_mask: document.getElementById('subnet_mask').value
      }
    };
  
    try {
      const response = await fetch('http://localhost:3000/api/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
  
      const result = await response.json();
      document.getElementById('output').textContent = result.config || result.error;
    } catch (err) {
      document.getElementById('output').textContent = 'Error connecting to server.';
    }
  });
  
// dashboard.js
// Geolocation, BLE, sensor data, info modal logic

function detectLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            document.getElementById('latitude').value = pos.coords.latitude;
            document.getElementById('longitude').value = pos.coords.longitude;
            var map = L.map('map').setView([pos.coords.latitude, pos.coords.longitude], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map);
        }, function() {
            alert('Unable to retrieve location.');
        });
    } else {
        alert('Geolocation not supported.');
    }
}

function scanBLE() {
    // Placeholder for BLE scan/connect
    document.getElementById('bleStatus').textContent = 'Connected';
    // Actual implementation would use Web Bluetooth API
}

function readSensorData() {
    // Placeholder for sensor data fetch
    fetch('/api/sensor_data')
        .then(res => res.json())
        .then(data => {
            document.querySelector('input[name="temperature"]').value = data.temperature;
            document.querySelector('input[name="pH"]').value = data.pH;
            document.querySelector('input[name="DO"]').value = data.DO;
            document.querySelector('input[name="TDS"]').value = data.TDS;
            document.querySelector('input[name="chlorophyll"]').value = data.chlorophyll;
            document.querySelector('input[name="TA"]').value = data.TA;
            document.querySelector('input[name="DIC"]').value = data.DIC;
        });
}

function showInfo() {
    document.getElementById('infoModal').style.display = 'block';
}
function closeInfo() {
    document.getElementById('infoModal').style.display = 'none';
}

// Set date and time on form submit
const form = document.getElementById('dataEntryForm');
if (form) {
    form.addEventListener('submit', function(e) {
        document.getElementById('dateField').value = new Date().toLocaleDateString('en-GB');
        document.getElementById('timeField').value = new Date().toLocaleTimeString('en-GB');
    });
}

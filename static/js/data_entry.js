// data_entry.js - NASA/ISRO-style strict workflow, animated progress, Bluetooth scan/select, sensor fetch on demand
document.addEventListener('DOMContentLoaded', function() {
        // Confirm JS is running
        const jsStatus = document.createElement('div');
        jsStatus.id = 'js-status';
        jsStatus.style = 'color:#00ffcc; font-weight:bold; margin-bottom:8px;';
    // Step progress
    const stepLoc = document.getElementById('step-loc');
    const stepWater = document.getElementById('step-water');
    const stepPin = document.getElementById('step-pin');
    const stepBt = document.getElementById('step-bt');
    const stepSensor = document.getElementById('step-sensor');
    const stepImg = document.getElementById('step-img');
    // Fields
    const dateField = document.getElementById('date');
    const timeField = document.getElementById('time');
    const latField = document.getElementById('latitude');
    const lonField = document.getElementById('longitude');
    const waterType = document.getElementById('water-type');
    const pinId = document.getElementById('pin_id');
    const scanBtn = document.getElementById('scan-btn');
    const readSensorBtn = document.getElementById('read-sensor-btn');
    const imageInput = document.getElementById('image');
    const submitBtn = document.querySelector('.submit-btn');
    // Sensor fields
    const tempField = document.getElementById('temperature');
    const phField = document.getElementById('ph');
    const doField = document.getElementById('do');
    const tdsField = document.getElementById('tds');
    const chlField = document.getElementById('chlorophyll');
    const taField = document.getElementById('ta');
    const dicField = document.getElementById('dic');
    const statusIndicator = document.getElementById('sensor-status');
    const bluetoothList = document.getElementById('bluetooth-list');
    // Step 0: Set all fields except location to disabled
        // Enable all fields and buttons at once (no step-by-step enforcement)
        if (latField) latField.disabled = false;
        if (lonField) lonField.disabled = false;
        if (waterType) waterType.disabled = false;
        if (pinId) pinId.disabled = false;
        if (scanBtn) scanBtn.disabled = false;
        if (readSensorBtn) readSensorBtn.disabled = false;
        if (imageInput) imageInput.disabled = false;
        if (submitBtn) submitBtn.disabled = false;
    // Step 1: Auto-fill date/time (hidden)
    function setDateTime() {
        const now = new Date();
        if (dateField) dateField.value = now.toISOString().slice(0, 10);
        if (timeField) timeField.value = now.toTimeString().slice(0, 5);
    }
    setDateTime();
    // Progress indicator helpers
    function setStepActive(step) {
        [stepLoc, stepWater, stepPin, stepBt, stepSensor, stepImg].forEach(s => s && s.classList.remove('active'));
        if (step) step.classList.add('active');
    }
    function setStepDone(step) {
        if (step) step.classList.add('done');
    }
    function resetSteps() {
        [stepLoc, stepWater, stepPin, stepBt, stepSensor, stepImg].forEach(s => {
            if (s) { s.classList.remove('active'); s.classList.remove('done'); }
        });
    }
    resetSteps();
    setStepActive(stepLoc);
    // --- Geolocation & Map (Leaflet.js) ---
    const detectBtn = document.getElementById('detect-location');
    const mapDiv = document.getElementById('map');
    let map, marker;
    detectBtn && detectBtn.addEventListener('click', function() {
        if (!navigator.geolocation) {
            alert('Geolocation not supported.');
            return;
        }
        detectBtn.disabled = true;
        detectBtn.textContent = 'Detecting...';
        navigator.geolocation.getCurrentPosition(function(pos) {
            const lat = pos.coords.latitude.toFixed(6);
            const lon = pos.coords.longitude.toFixed(6);
            latField.value = lat;
            lonField.value = lon;
            latField.disabled = false;
            lonField.disabled = false;
            setStepDone(stepLoc); setStepActive(stepWater);
            if (waterType) waterType.disabled = false;
            if (!map) {
                map = L.map('map').setView([lat, lon], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(map);
            } else {
                map.setView([lat, lon], 15);
            }
            if (marker) map.removeLayer(marker);
            marker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'glow-marker',
                    html: '<div style="width:24px;height:24px;border-radius:50%;background:#00c3ff;box-shadow:0 0 24px #00c3ff99;"></div>'
                })
            }).addTo(map);
            detectBtn.textContent = 'Detect Location';
            detectBtn.disabled = false;
        }, function() {
            alert('Unable to detect location.');
            detectBtn.textContent = 'Detect Location';
            detectBtn.disabled = false;
        });
    });
    // 2. Enable pin ID after water type
    waterType && waterType.addEventListener('change', function() {
        if (waterType.value) {
            pinId.disabled = false;
            setStepDone(stepWater); setStepActive(stepPin);
        } else {
            pinId.disabled = true;
        }
    });
    // 3. Enable Bluetooth scan after pin ID
        // Step-by-step workflow removed: Bluetooth scan always enabled
    // 4. Bluetooth scan/select
    let bluetoothConnected = false;
    let selectedDevice = null;
    if (scanBtn) {
        scanBtn.addEventListener('click', async function() {
            alert('Bluetooth scan button clicked!');
            console.log('[BLE] Scan button clicked');
            statusIndicator.textContent = '🟡 Scanning';
            statusIndicator.style.background = '#1e90ff77';
            bluetoothList.innerHTML = '';
            if (navigator.bluetooth) {
                try {
                    console.log('[BLE] Requesting Bluetooth device...');
                    const device = await navigator.bluetooth.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: ['device_information']
                    });
                    selectedDevice = device.name || device.id;
                    statusIndicator.textContent = '🟢 Connected';
                    statusIndicator.style.background = '#00c3ff77';
                    bluetoothConnected = true;
                    bluetoothList.innerHTML = `<div style='color:#00ffcc;'>Connected to ${selectedDevice}</div>`;
                    readSensorBtn.disabled = false;
                    setStepDone(stepBt); setStepActive(stepSensor);
                    console.log('[BLE] Device selected:', device);
                } catch (err) {
                    statusIndicator.textContent = '🔴 Not Connected';
                    statusIndicator.style.background = '#ff4444cc';
                    bluetoothConnected = false;
                    let msg = 'No Bluetooth devices found or permission denied.';
                    if (err.name === 'NotFoundError') {
                        msg += ' (No devices found or selection cancelled)';
                    } else if (err.name === 'NotAllowedError') {
                        msg += ' (Permission denied. Make sure to allow Bluetooth access.)';
                    } else if (err.name === 'NotSupportedError') {
                        msg += ' (Web Bluetooth not supported on this device/browser.)';
                    }
                    bluetoothList.innerHTML = `<div style="color:#b0cfff;">${msg}</div>`;
                    console.error('[BLE] Scan error:', err);
                }
            } else {
                statusIndicator.textContent = 'Bluetooth not supported';
                statusIndicator.style.background = '#ff4444cc';
                bluetoothList.innerHTML = '<div style="color:#b0cfff;">Bluetooth not supported in this browser.</div>';
            }
        });
    } else {
        alert('Bluetooth scan button not found in DOM!');
        console.error('[BLE] Scan button not found in DOM');
    }
    // 5. Sensor data fetch (on button click)
    readSensorBtn && readSensorBtn.addEventListener('click', function() {
            // Step-by-step workflow removed: allow sensor read regardless of Bluetooth connection
        // Simulate sensor values
        tempField && (tempField.value = (22 + Math.random() * 5).toFixed(2));
        phField && (phField.value = (7 + Math.random()).toFixed(2));
        doField && (doField.value = (6 + Math.random() * 2).toFixed(2));
        tdsField && (tdsField.value = (300 + Math.random() * 50).toFixed(1));
        chlField && (chlField.value = (1 + Math.random() * 2).toFixed(2));
        taField && (taField.value = (100 + Math.random() * 20).toFixed(1));
        dicField && (dicField.value = (2 + Math.random() * 0.5).toFixed(2));
        setStepDone(stepSensor); setStepActive(stepImg);
        imageInput.disabled = false;
        submitBtn.disabled = false;
    });
    // --- Image Upload Preview ---
    const imagePreview = document.getElementById('image-preview');
    imageInput && imageInput.addEventListener('change', function() {
        if (imageInput.files && imageInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            imagePreview.innerHTML = '';
            imagePreview.style.display = 'none';
        }
    });
    // --- Animated Success Message on Submit ---
    const form = document.getElementById('data-form');
    const successMsg = document.getElementById('success-message');
    form && form.addEventListener('submit', function(e) {
        e.preventDefault();
        setDateTime(); // Ensure date/time is up to date
        const formData = new FormData(form);
        fetch('/submit', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                successMsg.innerHTML = `<svg width=\"48\" height=\"48\" viewBox=\"0 0 48 48\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" style=\"vertical-align:middle;margin-bottom:8px;\"><circle cx=\"24\" cy=\"24\" r=\"22\" stroke=\"#00ffcc\" stroke-width=\"4\" fill=\"#1e90ff33\"/><path d=\"M14 25l7 7 13-13\" stroke=\"#00ffcc\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg><div>Mission data uplink successful</div>`;
                successMsg.style.display = 'block';
                setTimeout(() => {
                    successMsg.style.display = 'none';
                    window.location.href = '/';
                }, 2000);
            }
        });
    });
});

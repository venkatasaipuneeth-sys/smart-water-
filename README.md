# Professional IoT Water Quality Monitoring Web App (Flask)

This project is a professional, animated data entry web application for an IoT-based Water Quality Monitoring System. It features authentication, project selection, animated dashboards, Bluetooth sensor integration, geolocation, map display, and a scientific dark theme inspired by ISRO/NASA dashboards.

## Features
- Animated login/register UI
- Project selection dashboard (Ocean Water / Pond Health)
- Bluetooth sensor panel (Web Bluetooth API)
- Water type selection (dropdown/segmented control)
- Geolocation and animated map (Leaflet.js)
- Date, time, and image upload panel
- Auto-filled sensor fields (read-only)
- Animated submission and feedback
- SQLite database for all data

## Tech Stack
- Backend: Python (Flask)
- Frontend: HTML, CSS, JavaScript
- Bluetooth: Web Bluetooth API
- Map: Leaflet.js
- Animations: CSS, JS transitions

## How to Run
1. Install Python 3.8+
2. Create a virtual environment and activate it
3. Install dependencies: `pip install -r requirements.txt`
4. Run the app: `python app.py`
5. Open in browser: http://localhost:5000

## Notes
- Replace placeholder assets as needed
- For Bluetooth, use a supported browser (Chrome/Edge)
- For map, internet access is required for OpenStreetMap tiles

---

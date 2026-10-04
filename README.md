# QR Generator

A modern, fast, and customizable QR code generator built with JavaScript, CSS, and Python.

## Features

- **Instant Generation**: Works right in your browser offline or locally without needing a server running.
- **Python Backend & Serverless API**: Includes a lightweight Python API (`/api/index?url=...`) compatible with Vercel and local Python servers.
- **Customizable**: Change QR code colors (foreground and background) and output size.
- **Download & Copy**: Instant one-click PNG download or direct copy to clipboard.
- **Quick Presets**: Fast templates for Links, Text, Wi-Fi, and Email.

## Running the App

### Option 1: Direct Browser (No Server Needed)
Simply double-click or open `public/index.html` in any web browser. QR generation will work immediately!

### Option 2: Local Python Server
1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # On Windows
   # or source .venv/bin/activate  # On Linux/macOS
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the server:
   ```bash
   python api/index.py
   ```
4. Open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 3: Deploy to Vercel
Deploy directly using the Vercel CLI or by linking your GitHub repository. The `vercel.json` rewrites and `api/index.py` serverless functions are pre-configured.

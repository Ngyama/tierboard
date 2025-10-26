# TierMaker - Game Tier List Creation Tool

A modern game tier list creation tool with drag-and-drop functionality and IGDB game database integration.

## Features

- **Tier System**: Supports S, A, B, C, D, F six tiers
- **Drag and Drop**: Intuitive drag-and-drop sorting functionality
- **Game Search**: Integrated IGDB API for searching games and adding covers
- **Responsive Design**: Supports desktop and mobile devices
- **Data Persistence**: Automatically saves to local storage
- **Export Function**: Supports exporting tier charts as PNG

## Installation and Setup

### 1. Clone the Project
```bash
git clone <your-repo-url>
cd tierboard
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` file to `.env`:
```bash
cp .env.example .env
```

Edit the `.env` file and add your IGDB API credentials:
```env
IGDB_CLIENT_ID=your_client_id_here
IGDB_CLIENT_SECRET=your_client_secret_here
```

### 4. Get IGDB API Credentials
1. Visit [IGDB API](https://api.igdb.com/)
2. Register an account and create an application
3. Get Client ID and Client Secret
4. Add the credentials to the `.env` file

### 5. Start the Server
```bash
npm start
```

### 6. Access the Application
Open your browser and visit: `http://localhost:3000`

## Usage

1. **Add Games**: Click the "+" button on any tier to search and add games
2. **Drag and Sort**: Drag images to different tiers or reorder within tiers
3. **Export Results**: Click "Export Tier Chart" button to save as PNG
4. **Clear All**: Click "Clear All" button to reset all data

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **API**: IGDB (Internet Game Database)
- **Styling**: CSS Grid, Flexbox, Responsive Design

## Project Structure

```
tierboard/
├── index.html          # Main page
├── script.js           # Frontend logic
├── styles.css          # Style files
├── proxy_server.js     # Proxy server
├── package.json        # Project configuration
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore file
└── README.md           # Project documentation
```

## Security Notes

- `.env` file contains sensitive information and is added to `.gitignore`
- Do not commit real API keys to version control
- Use environment variables to manage sensitive information in production

## License

MIT License

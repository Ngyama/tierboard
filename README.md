# TierMaker - Game Tier List Creation Tool

A modern game tier list creation tool with drag-and-drop functionality and IGDB game database integration.

## Features

- **Tier System**: Supports S, A, B, C, D, F six tiers
- **Drag and Drop**: Intuitive drag-and-drop sorting functionality
- **Game Search**: Integrated IGDB API for searching games and adding covers
- **Book Search**: Integrated Google Books API for searching books and adding covers
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

Edit the `.env` file and add your API credentials:
```env
IGDB_CLIENT_ID=your_client_id_here
IGDB_CLIENT_SECRET=your_client_secret_here
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here
```

### 4. Get API Credentials

#### IGDB API (for games)
1. Visit [IGDB API](https://api.igdb.com/)
2. Register an account and create an application
3. Get Client ID and Client Secret
4. Add the credentials to the `.env` file

#### Google Books API (for books)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Books API
4. Create credentials (API Key)
5. Add the API key to the `.env` file

### 5. Start the Server
```bash
npm start
```

### 6. Access the Application
Open your browser and visit: `http://localhost:3000`

## Usage

1. **Add Items**: Click the "+" button on any tier to search and add games, books, anime, or music
2. **Drag and Sort**: Drag images to different tiers or reorder within tiers
3. **Export Results**: Click "Export Tier Chart" button to save as PNG
4. **Clear All**: Click "Clear All" button to reset all data

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express
- **APIs**: IGDB (Internet Game Database), Google Books API
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

This app requires two terminals: one for the frontend and one for the backend.

Start the backend (Express server):

node server.js


Backend listens on port 4000 (or the port set in .env).

Make sure MongoDB is running.

Start the frontend (Vite dev server):

npm run dev


Opens the app in your browser (default: http://localhost:5173).

Frontend communicates with backend via API calls.

Both servers must run simultaneously for the app to work.
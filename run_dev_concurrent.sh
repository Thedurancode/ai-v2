#!/bin/bash

# Start React dev server in the background
echo "Starting React dev server..."
cd dura-react
npm install &
wait
npm run dev &
REACT_PID=$!
cd ..

# Start Flask app
echo "Starting Flask server..."
python3 app.py &
FLASK_PID=$!

# Handle termination
trap "kill $REACT_PID $FLASK_PID; exit" INT TERM EXIT

# Keep script running
wait 
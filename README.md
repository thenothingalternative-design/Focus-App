# FocusApp

A cross-platform app that cuts down digital distractions with synchronized focus sessions. 
Start a focus/study/blocking session on one device and every connected device shows it. 
Distracting apps are blocked until the session ends. For now, it only works on Android. 

# Features

Synchronized focus sessions across multiple devices in real time
Session state persists in PostgreSQL, so devices recover after reconnecting
Android app blocking during active sessions via a native Kotlin AccessibilityService
Server-driven countdown, so all devices agree on when a session ends

# How It Works

Each device registers with a shared pairing code. 
This code acts as an "account", so two devices with the same code will be treated as the same user.
Starting a session writes it to Postgres and broadcasts session_started to all of that user's connected devices.
Each device runs a countdown from the server's end_time.
While a session is active, the Android app tells the Kotlin AccessibilityService to send the user home whenever a blocked app opens.
On every WebSocket connect, the server sends the current active session, so reconnects restore state.

# Running Locally

Backend:

Create a new project in Railway, and link PostgreSQL to it via the variables tab (link the backend service to the 
Postgres DATABASE_URL). Clone this repository (git clone https://github.com/thenothingalternative-design/Focus-App.git), 
then link your Railway backend service to the /backend folder inside the repo. (Link it to the repo, then set the root folder
for Railway to pull from.) 
Lastly, under your backend service settings, generate a Domain. 
Paste this Domain URL into FocusApp/src/config.ts as your mobile app's backend endpoint. 

# Mobile

If you haven't already, set your backend Domain URL and pairing code in src/config.ts. Run on a physical Android device with npx react-native run-android.
In the app, tap Open settings and enable the FocusApp accessibility service. 

# Notes 

This is a cleaned-up recommit of a previous repository, The-Nothing-Alternative. 


# FocusApp

A cross-platform app that cuts down digital distractions with synchronized focus sessions. 
Start a focus/study/blocking session on one device and every connected device shows it. 
Distracting apps are blocked until the session ends. For now, blocking only works on Android. 

## Features

Synchronized focus sessions across multiple devices in real time
Session state persists in PostgreSQL, so devices recover after reconnecting
Android app blocking during active sessions via a native Kotlin AccessibilityService
Server-driven countdown, so all devices agree on when a session ends

## How It Works

Each device registers with a shared pairing code. 
This code acts as an "account", so two devices with the same code will be treated as the same user.
Starting a session writes it to Postgres and broadcasts session_started to all of that user's connected devices.
Each device runs a countdown from the server's end_time.
While a session is active, the Android app tells the Kotlin AccessibilityService to send the user home whenever a blocked app opens.
On every WebSocket connect, the server sends the current active session, so reconnects restore state.

## Running Locally

Backend:

Create a new project in Railway, and link PostgreSQL to it via the variables tab (link the backend service to the 
Postgres DATABASE_URL). Clone this repository (git clone https://github.com/thenothingalternative-design/Focus-App.git), 
then link your Railway backend service to the /backend folder inside the repo. (Link it to the repo, then set the root folder
for Railway to pull from.) 
Lastly, under your backend service settings, generate a Domain. 
Paste this Domain URL into FocusApp/src/config.ts as your mobile app's backend endpoint. 

## Mobile

If you haven't already, set your backend Domain URL and pairing code in src/config.ts. The default is my-code-123. 
Set it to your own code before building the app. 

Run on a physical Android device with npx react-native run-android: 

First, make sure you turn on developer settings on your phone and connect it via adb: 
https://www.howtogeek.com/125769/how-to-install-and-use-abd-the-android-debug-bridge-utility/

Then, run these commands in your command prompt terminal: 

```bash 
cd /path/to/where/you/cloned/the/repo #<- this is the path to the inner nested FocusApp folder, not the root one 
npm install
npx react-native run-android
``` 

In the app, tap Open settings and enable the FocusApp accessibility service. 
The app should show a screen with a 25:00 minute focus session ready to start. 

# How to Test different functions: 

## Blocking: 

The app has a simple, hardcoded blocklist, within src/blocker.ts: 

```bash 
export const BLOCK_LIST = [
  'com.instagram.android',
  'com.zhiliaoapp.musically', // TikTok
  'com.google.android.youtube',
  'com.twitter.android',
  'com.reddit.frontpage',
  'com.facebook.katana', 
];
```

After starting a session, simply open any of the apps listed above. If accessibility has been enabled, 
you should be bounced right back to the phone home screen after opening it. 

## Connection: 

Here are the steps to test with a laptop browser acting as a secondary device: 

Go to your Railway ***production*** URL; it should follow the form of: 
https://YOUR-RAILWAY-GENERATED-BACKEND-DOMAIN/docs . 
Something like: https://focus-app-backend-production-1ab2.up.railway.app/docs 

Here, you can send API calls to the server and see how it would respond. 
Go to POST/register and expand it. Press Try It Out. Send the following json: 

```bash
{"pairing_code": "my-code-123", "device_name": "laptop", "platform": "web"} 
``` 

Recall "my-code-123" is the default set in src/config.ts. 
Change it to whatever you set earlier before you built the app. After pressing Execute, copy the USER_ID given in the output. 

Lastly, open any browser tab and press F12 to open the console. Select console,
then paste the following: 

```bash
ws = new WebSocket('wss://YOUR-RAILWAY-GENERATED-BACKEND-DOMAIN/ws/PASTE_USER_ID');
ws.onmessage = e => console.log(e.data);
```

When I first tested, it prompted me to type "allow pasting" to allow pasting. I guess beware of pasting random 
code you find online into your console... The above code is safe. 

Anyways you should immediately see a state message of some sort. Try starting and stopping the session twice from your phone: 

```bash
{"type":"state","session":{"id":"02dfc54a-409b-44e9-a8db-91051c599c62","start_time":"2026-10-31T21:11:01.530754+00:00","end_time":"2026-11-01T21:36:01.526232+00:00","status":"active"}} 
VM5365:2 {"type":"session_ended"}
VM5365:2 {"type":"session_started","session":{"id":"4f44b1b9-8daf-4469-9309-bae0b684cc37","start_time":"2026-10-31T21:14:47.070729+00:00","end_time":"2026-11-01T21:39:47.067285+00:00","status":"active"}}
VM5365:2 {"type":"session_ended"}
```

You can try the other way, with the phone being the one to receive start_session. Go back to your backend production docs page.
In POST/sessions/start, try it out with the given USER and DEVICE IDs from the earlier POST/register. Set minutes to anything (like 5). 
Press Execute. Your phone should immediately start a session with the inputted minutes. If you kept the console page open, you can see session_start and stop from there too. 

# Notes 

This is a cleaned-up recommit of a previous repository, The-Nothing-Alternative. 


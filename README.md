# Oxygen Guardian

Build a simple, modern web dashboard for our ESP32-based Dual Oxygen Cylinder Monitoring & Automatic Changeover System.

Our Idea

We have two oxygen cylinders (C1 & C2) placed on load cells. The ESP32 continuously measures their weight through HX711 sensors. When the active cylinder reaches a low-level threshold, the system automatically closes its valve and switches to the available backup cylinder using servo-controlled valves.

Current Parameters

Full cylinder reference: 1000 g

Low-level threshold: 5% = 50 g

C1 weight and C2 weight must be monitored in real time.

C1 valve and C2 valve status must be displayed.

Active cylinder must be clearly displayed.

Automatic Logic

C1 > 50 g → C1 active, C1 valve OPEN, C2 valve CLOSED

C1 ≤ 50 g + C2 > 50 g → C1 CLOSED, C2 OPEN, switch active source to C2

C1 ≤ 50 g + C2 ≤ 50 g → Both valves CLOSED, show BOTH CYLINDERS LOW

Dashboard Requirements

Show and monitor:

C1 current weight

C2 current weight

C1 remaining percentage

C2 remaining percentage

C1/C2 valve status

Active cylinder

Automatic changeover status/history

Low-level alerts

ESP32/sensor connection status

Real-time weight graph

Controls

Allow authorized control of:

C1 valve OPEN/CLOSE

C2 valve OPEN/CLOSE

AUTO/MANUAL mode

Full-weight parameter

Low-threshold percentage

Calibration parameters

Create a clean industrial + medical-tech style dashboard, responsive on desktop and mobile, with clear green/amber/red status indicators. Keep the architecture ready for future ESP32 real-time integration.


## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

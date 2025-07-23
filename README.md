# 🕹️ Transcendence

Transcendence is a multiplayer arcade game inspired by the classic **Pong**, reimagined with modern mechanics, customization, and social features.

## 👥 Project Authors
The project was created by **42 students**:

| Tiago | Adilson | Sergey | Evgeniy |
|-------|-------|--------|---------|
| ![](/frontend/public/assets/avatars/Tiago.png) | ![](/frontend/public/assets/avatars/Acuva.png) | ![](/frontend/public/assets/avatars/SEREGA.png) | ![](/frontend/public/assets/avatars/Evneniy.png) |

---

## 🎮 Features

- A dynamic and interactive **frontend interface**
- A robust **backend infrastructure**, including:
  - 🔐 **Authentication** with JWT, Google OAuth, and optional 2FA
  - 🏆 **Tournament system** to compete with other players
  - 🎮 **Online, Local Games, and Tournaments**
  - 🗨️ **Game rooms with live chat** and **private messaging**
  - 👤 **Player profiles** featuring avatars, statistics, and match history
  - 🤝 **Social interactions**: add friends, block users, remove connections
  - 📩 **Send direct messages** and **game invitations**

---

## 🚀 Getting Started

To run **Transcendence** locally, you only need **Docker** installed.

### 🔧 Installation Steps

1. **Clone the repository**
```bash
   git clone https://github.com/YourUsername/transcendence.git
   cd transcendence
```
2. **Define .env files**
```bash
cp backend/server/.env.example backend/server/.env
cp frontend/.env.example frontend/.env
```
3. **Run docker**
```bash
make
```

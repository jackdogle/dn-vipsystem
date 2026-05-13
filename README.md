# 🌌 Darkness OS | Premium Tablet Shop System

![Version](https://img.shields.io/badge/version-2.0.0-ff0044)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-FiveM%20%2F%20RedM-orange)

**Darkness OS** is a high-fidelity, tablet-inspired UI designed for modern Roleplay servers. It bridges the gap between gameplay and interface by providing a tactile, immersive "operating system" experience for Gacha systems, VIP management, and server administration.

---

## ✨ Key Features

### 🎰 Advanced Gacha Engine
- **Fair-Play Pity System**: Integrated Epic (10-spin) and Legendary (80-spin) guarantees with visual feedback.
- **Dynamic Banners**: Support for standard, limited-time, and seasonal banners via a unified configuration.
- **Spin Safeguards**: Dual-layered confirmation modals to prevent accidental currency expenditure.
- **Real-Time Probabilities**: Translucent UI overlays showing item pools and drop rates.

### 📱 Immersion & UX ("Darkness OS")
- **Cinematic Boot Sequence**: A 2-second custom startup animation with pulsing logo branding.
- **Responsive Layout**: Designed for a 16:9 tablet aspect ratio with software-based navigation (Back/Home/Recent).
- **Theme Engine**: Persistence-ready Light and Dark modes with automatic Lucide icon adaptation.
- **High-Yield Interactions**: Cards feature 3D-space scaling, glow transients, and smooth state interpolation.

### 🛡️ Secure Architecture
- **NUI-to-Game Communication**: Strictly handled via asynchronous POST requests with callback verification.
- **State Protection**: Item states and user Pity progress are handled as server-authoritative components.
- **Admin Gateway**: Integrated dashboard for real-time server monitoring and resource management.

---

## 🚀 Installation

### Prerequisites
- A functional FiveM/Redm server (ESX, QBCore, or Standalone).
- Basic knowledge of `fxmanifest.lua` and resource starting.

### Setup Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/darkness-shop.git
   ```
2. **Resource Configuration**:
   Move the folder to your `resources/` directory and rename it to `darkness-shop`.
3. **Database Integration**:
   Import the provided `database.sql` to your SQL server to initialize Pity scores and VIP tables.
4. **Final Activation**:
   Add the following line to your `server.cfg`:
   ```cfg
   ensure darkness-shop
   ```

---

## ⚙️ Configuration

The UI is highly modular. Core settings can be adjusted in `html/script.js`:

```javascript
const gachaBanners = {
    'limited_hypercar': {
        label: "HYPERCAR LIMITED",
        price: 5000,
        color: "#ff0044",
        // ...
    }
};
```

---

## 🛠️ Built With

- **HTML5/CSS3**: Utilizes CSS Grid and Flexbox for maximum compatibility.
- **Tailwind CSS**: Modern utility classes for rapid styling.
- **Lucide Icons**: Crisp, vector-based iconography.
- **Darkness OS Core**: Proprietary rendering logic for smooth tablet transitions.

---

## 🎨 Creative Credits

| Role | Author |
| :--- | :--- |
| **Lead Developer** | [Jack Dogle](https://github.com/jack-dogle) |
| **UX/UI Design** | Darkness Community Design Team |
| **Security Audit** | Antigravity AI Agent |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <i>Developed with passion by Jack Dogle for the Darkness Community.</i><br>
  <strong>Immersive UI. Unmatched Speed. Darkness OS.</strong>
</p>

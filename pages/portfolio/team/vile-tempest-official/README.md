# Vile Tempest Official

Official web hub and repository for **Vile Tempest Official** (MOB EXTRA), providing fast, lightweight client-side gaming utilities, test server resources, and professional technical freelance solutions.

---

## 🚀 Overview & Features

- **CODM Public Test Server Hub:** Quick, centralized access to official Android APK and iOS TestFlight download links as soon as they drop.
- **CODM IGN Formatter:** Custom Unicode space generator (non-breaking and Hangul spaces) engineered for custom in-game name styling.
- **CODM Redeem Codes Hub:** Daily updated redemption codes for Garena and Global versions.
- **Shared data services:** CODM data and Firebase review features use the MOB EXTRA site's centralized browser-side clients in [`assets/js/server/`](../../../../assets/js/server/), so repository endpoints, Firebase configuration, and database operations are not duplicated across pages.
- **Professional Services & Commissions:** Client portals and inquiry management for custom Web Development, C++ console programs, Flowcharts & DFDs, Excel VBA automation, SketchUp 3D modeling, and AutoCAD drafting.
- **Real-Time Community Reviews:** Uses the shared MOB EXTRA review bootstrap and Firebase client. Reviews are page-specific and editable per browser device; do not add portfolio-specific Firebase or review-form code.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES Modules)
- **Styling & Architecture:** Custom CSS variables, responsive fluid layouts, and mobile-first design.
- **Backend & Database:** Firebase Firestore (Real-time reviews feed and data storage)
- **Hosting:** GitHub Pages

---

## 📂 Project Structure

```text
├── assets/
│   ├── css/          # Modular stylesheets (root, navigation, main, animation, footer)
│   ├── js/           # Core scripts, search filters, and sharing utilities
│   └── img/          # Brand logos, favicons, and banners
├── pages/
│   ├── codm-ptb-download/  # Public Test Build download repository
│   ├── codm-redeem-codes/  # Redemption codes hub
│   ├── services/           # Commissions & service details
│   └── shop/               # Digital storefront links
├── index.html        # Main landing portal
└── legal.html        # Terms of Service & Privacy Policy
```

The portfolio is hosted as static pages; shared repository and Firebase data are accessed in the browser through the MOB EXTRA clients rather than through a portfolio-specific server or duplicate configuration. Every owner-managed HTML page opts into reviews with `review-enabled=true` metadata and loads the shared `assets/js/review-bootstrap.js` module using the correct relative path. The portfolio viewer adds the same bootstrap when opening an eligible page.

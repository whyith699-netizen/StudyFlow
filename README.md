# 📚 Study Dashboard - Chrome Extension

> A comprehensive study dashboard Chrome extension with task management, class scheduling, deadline tracking, and cloud synchronization.

![Version](https://img.shields.io/badge/version-1.0-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![Firebase](https://img.shields.io/badge/firebase-enabled-orange)

---

## ✨ Features

### 📝 Task Management

- ✅ Create, edit, and delete tasks
- 🏷️ Organize tasks by class
- 📅 Set deadlines with time
- ⭐ Mark tasks as important
- ✔️ Track completion status
- 🔔 Deadline notifications (3 days & 3 hours before)

### 📚 Class Organization

- 📖 Manage multiple classes
- 🔗 Add class-related links (Zoom, Drive, etc.)
- 📆 Set class schedules by day
- 🎨 Custom icons for each class
- 📊 View tasks grouped by class

### ☁️ Cloud Synchronization

- 🔄 Real-time sync with Firebase
- 👤 User authentication (Google OAuth & Email/Password)
- 🔒 Secure data storage
- 📱 Access from any device

### 🎨 User Interface

- 🌓 Dark mode support
- 📱 Responsive design
- 🔍 Search and filter tasks
- 📄 Pagination for large datasets
- 🎯 Intuitive popup interface

---

## 🚀 Installation

### Quick Install (3 Steps!)

1. **Download ZIP:**
   - Go to [Releases](https://github.com/YOUR_USERNAME/study-dashboard/releases)
   - Download `study-dashboard.zip`

2. **Extract:**
   - Extract ZIP to any folder
   - Example: `C:\Extensions\study-dashboard\`

3. **Load in Chrome:**
   - Open `chrome://extensions/`
   - Turn ON **"Developer mode"** (top right toggle)
   - Click **"Load unpacked"**
   - Select the extracted folder
   - ✅ Done!

### First Time Use

1. Click the extension icon in Chrome toolbar
2. **Login** with Google OR register with email/password
3. Start adding classes and tasks!

---

## 🔄 How to Update

Since extension is installed via "Load unpacked", it doesn't auto-update.

**To update manually:**

1. Download new version ZIP from Releases
2. Extract and replace old files
3. Go to `chrome://extensions/`
4. Click **Reload** button on Study Dashboard
5. Updated! ✅

---

## ⚙️ Advanced Configuration (Optional)

<details>
<summary><b>Want to use your own Firebase backend?</b> Click to expand</summary>

The extension comes pre-configured and ready to use. But if you want your own Firebase:

### 1. Create Firebase Project

- Go to [Firebase Console](https://console.firebase.google.com/)
- Create project
- Enable Authentication (Google & Email/Password)
- Enable Firestore Database

### 2. Edit `firebase-config.js`

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... rest of config
};
```

### 3. Setup OAuth (for Google Sign-In)

- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create OAuth Client ID (Web Application)
- Add redirect URI: `https://[YOUR_EXTENSION_ID].chromiumapp.org/`
- Edit `oauth-config.js` with Client ID

### 4. Set Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /classes/{classId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

</details>

---

## 📖 Usage

### Getting Started

1. **Login or Register:**
   - Click extension icon
   - Choose Google Sign-In or Email/Password
   - Complete authentication

2. **Add Classes:**
   - Click "Add New Class"
   - Enter class name, select icon
   - Add related links (optional)
   - Set class schedule days

3. **Create Tasks:**
   - Click "Add Task" or "+" button
   - Enter task details
   - Set deadline and importance
   - Assign to a class

4. **Manage Tasks:**
   - Click task to edit
   - Check box to mark complete
   - View upcoming deadlines
   - Filter by class or status

---

## 🏗️ Architecture

### Tech Stack

- **Frontend:** HTML, CSS, JavaScript (Vanilla)
- **UI Framework:** Custom CSS with modern design
- **Icons:** Font Awesome 6.5.0
- **Backend:** Firebase (Auth + Firestore)
- **OAuth:** Chrome Identity API
- **Manifest:** V3 (Modern Chrome Extension)

### Project Structure

```
study-dashboard/
├── manifest.json              # Extension configuration
├── firebase-config.js         # Firebase credentials
├── oauth-config.js           # OAuth Client ID
├── sync-service.js           # Firebase & sync logic
├── background.js             # Service worker
├── popup/
│   ├── popup.html           # Main popup UI
│   ├── popup.js             # Main popup logic
│   ├── popup.css            # Styles
│   ├── login-popup.*        # Login interface
│   ├── add-task-popup.*     # Add task form
│   ├── edit-task-popup.*    # Edit task form
│   ├── my-tasks-popup.*     # Task list view
│   ├── add-class-popup.*    # Add class form
│   ├── edit-class-popup.*   # Edit class form
│   ├── class-detail-popup.* # Class details
│   └── auth-guard.js        # Auth protection
├── lib/
│   └── firebase/            # Firebase SDK (local)
└── assets/
    └── icons/               # Extension icons
```

---

## 🔒 Security

### Authentication

- Google OAuth 2.0 via Chrome Identity API
- Email/Password via Firebase Auth
- Required login for all features

### Data Protection

- Firestore Security Rules enforce user isolation
- API keys are safe for client-side (protected by rules)
- OAuth Client ID is public (protected by redirect URIs)
- No server secrets in code

### Privacy

- User data stored in personal Firebase account
- No third-party data collection
- Secure cloud synchronization

---

## 🛠️ Development

### Prerequisites

- Chrome browser (latest version)
- Firebase account
- Google Cloud Console account (for OAuth)

### Local Development

1. Make changes to source files
2. Reload extension at `chrome://extensions/`
3. Test changes in browser

### Build for Distribution

1. Remove development files:

   ```bash
   rm client_secret_*.json
   ```

2. Create `.gitignore`:

   ```
   client_secret_*.json
   .env
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "Release v1.0"
   git push origin main
   ```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Contact: [your-email@example.com]

---

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Google Chrome Extension APIs
- Font Awesome for icons
- All contributors and users

---

## 📸 Screenshots

### Main Dashboard

![Dashboard Screenshot](screenshots/dashboard.png)

### Task Management

![Tasks Screenshot](screenshots/tasks.png)

### Class Details

![Class Screenshot](screenshots/class.png)

---

**Made with ❤️ for students**

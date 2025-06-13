# Maveric Feedback

A feedback collection and analysis platform built with Firebase and Genkit AI.

## Features

- Collects user feedback via web forms
- Stores feedback securely in Firebase
- Uses Genkit AI for feedback analysis and insights
- Google Gemini integration for advanced AI features

## Project Workflow

### 1. User Feedback Submission

- Users access the feedback form through the web interface.
- They fill out and submit their feedback.
- The frontend sends the feedback data to the backend (Firebase).

### 2. Data Storage

- Feedback submissions are stored in Firebase Firestore for secure and scalable storage.
- Each feedback entry includes metadata such as timestamp, user ID (if available), and feedback content.

### 3. AI Analysis

- When new feedback is received, a backend function triggers Genkit AI (and optionally Google Gemini) to analyze the feedback.
- The AI model processes the text to extract sentiment, key topics, and actionable insights.
- Analysis results are stored alongside the original feedback in Firestore.

### 4. Admin Dashboard

- Admins can log in to a protected dashboard.
- The dashboard displays all feedback entries and their AI-generated insights.
- Admins can filter, search, and export feedback for further review.

### 5. Notifications (Optional)

- The system can be configured to send notifications (email, Slack, etc.) when critical or negative feedback is detected by the AI.

### 6. Security

- Sensitive API keys and tokens are managed using environment variables and are never committed to the repository.
- User data is protected using Firebase Authentication and Firestore security rules.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- [Yarn](https://yarnpkg.com/) or npm

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/NitinGavhane/maveric-feedback.git
   cd maveric-feedback
   ```

2. **Install dependencies:**
   ```sh
   yarn install
   # or
   npm install
   ```

3. **Set up environment variables:**
   - Create a `.env` file in the root directory.
   - Add your API keys and secrets:
     ```
     HUGGINGFACE_API_TOKEN=your_huggingface_token
     FIREBASE_API_KEY=your_firebase_api_key
     # Add other required environment variables here
     ```

4. **Start the development server:**
   ```sh
   yarn dev
   # or
   npm run dev
   ```

## Usage

- Visit the local server URL shown in your terminal.
- Submit feedback through the web interface.
- View and analyze feedback in the admin dashboard.

## Project Structure

```
src/
  ai/           # AI integration and analysis logic
  components/   # UI components
  firebase/     # Firebase configuration and functions
  ...
```

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

**Note:**  
Do not commit secrets or API keys to the repository. Use environment variables and `.gitignore` to keep them safe.

# sudocore — The Calm Sudoku Studio

[![Brand Icon](public/sudocore-icon.svg)](https://sudocore.vercel.app)

**sudocore** is not just another Sudoku website—it's a premium **Learning Platform and Social Service** built for the modern age. It transforms the solitary puzzle-solving experience into a mindful, educational, and collaborative journey.

[Live Demo](https://sudocore.vercel.app)

---

## 🌟 Product Vision & Philosophy

In a world of high-dopamine distractions, **sudocore** serves as a "daily brain ritual." Our goal was to create a **Sudoku-as-a-Service (SaaS)** model that provides:

1.  **Education over Spoilers**: Most apps just give you the answer. sudocore's AI Coach teaches you the *logic* behind the move.
2.  **Social Connection**: Sudoku is traditionally lonely. Our real-time collaboration rooms turn it into a team-building exercise.
3.  **Mindful Aesthetics**: A "calm-first" design language that reduces eye strain and promotes focus.

## ❤️ Creative Implementation & Design Decisions

We took the standard technical requirements and elevated them with creative features that differentiate **sudocore** from competitors:

### 🧠 The "AI Coach" (Educational Core)
Instead of a simple "Hint" button, we built a logic-driven mentor. It identifies complex techniques like *Locked Candidates* or *Hidden Singles* and explains them with a "Proof" step. This turns every game into a potential learning session, adding value that users are willing to pay for in the **Pro Tier**.

### 🤝 Real-Time Collaboration
Using **Supabase Realtime**, we implemented shared board sessions. This isn't just about playing together; it's about *consensus*. Players can propose moves, and others can see them in real-time, complete with remote cursors and a voting system. This makes **sudocore** a viable platform for streamers and friends.

### 🏙️ Hyper-Local Competition
The **Daily Challenge** isn't just global; it's local. By allowing users to select their city, we create a sense of community and friendly neighborhood rivalry, significantly increasing user retention.

### 🎨 Design Systems
Built with **Tailwind CSS v4** and **Framer Motion**, the interface features micro-animations and smooth state transitions that make the app feel "alive" and premium.

---

## ✨ Key Features

-   **🧠 AI Coach**: Intelligent, proof-backed hints for advanced techniques.
-   **👫 Collaborative Rooms**: Real-time multiplayer with shared board control.
-   **🛤️ Learning Path**: A structured, tiered curriculum for Sudoku mastery.
-   **📅 Daily Ritual**: Unique daily boards with streaks and city leaderboards.
-   **🏛️ Famous Puzzles**: A digital museum of historic, hand-crafted boards.
-   **🌓 Premium Themes**: Curated palettes like *Sakura*, *Ocean*, and *Logic Studio*.
-   **🌍 Globalization**: Full Localization for English, Russian, and Kazakh audiences.
-   **👑 Monetization Ready**: Integrated with **Polar.sh** for a seamless Pro subscription experience.

---

## 🚀 Tech Stack

-   **Frontend**: React 19, Vite 7
-   **Styling**: Tailwind CSS v4, Framer Motion
-   **Data & Realtime**: Supabase (Postgres + Realtime + Auth)
-   **Business Logic**: Polar.sh (Subscription SaaS infrastructure)
-   **Architecture**: Feature-sliced design for scalability and maintainability.

---

## 🛠️ Getting Started

### Prerequisites
-   Node.js (v18+)
-   Supabase Project
-   Polar.sh Account (for Pro features)

### Installation
1.  **Clone & Install**:
    ```bash
    git clone https://github.com/Kikatsu/Sudoku.git
    cd Sudoku
    npm install
    ```
2.  **Configure Environment**:
    ```bash
    cp .env.example .env
    # Add your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
    ```
3.  **Run Development**:
    ```bash
    npm run dev
    ```

## 📄 License
This project is licensed under the MIT License.

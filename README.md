# sudocore — a calm Sudoku studio

[![Brand Icon](public/sudocore-icon.svg)](https://sudocore.vercel.app)

**sudocore** is a feature-rich, high-performance Sudoku platform designed for both solo practice and real-time collaborative play. Built with a focus on education, it features an AI-powered coach that helps players master complex techniques without spoiling the solution.

[Live Demo](https://sudocore.vercel.app)

---

## ✨ Key Features

-   **🧠 AI Coach**: Intelligent hints, lessons, and step-by-step explanations for techniques like Naked Singles, Hidden Singles, and Locked Candidates.
-   **👫 Collaborative Rooms**: Share a link and solve the same board simultaneously with friends in real-time.
-   **🛤️ Learning Path**: A structured curriculum that takes you from beginner to expert through interactive lessons.
-   **📅 Daily Challenge**: A unique daily board with streaks, XP, and city-based leaderboards.
-   **🏛️ Famous Puzzles**: A curated collection of historic Sudoku boards that made history.
-   **🌓 Visual Themes**: Multiple premium themes including Logic Studio, Ocean, and Sakura.
-   **🌍 Multi-language Support**: Fully localized in English, Russian, and Kazakh.
-   **☁️ Cloud Sync**: Seamless progress synchronization across devices via Supabase.
-   **👑 Pro Subscription**: Unlimited play, full AI Coach access, and deep statistics via Polar.sh.

## 🚀 Tech Stack

-   **Frontend**: React 19, Vite 7
-   **Styling**: Tailwind CSS v4, Framer Motion (animations), Lucide React (icons)
-   **Backend**: Supabase (Auth, Postgres, Realtime, Edge Functions)
-   **Payments**: [Polar.sh](https://polar.sh) (Subscription management)
-   **Deployment**: Vercel

## 🛠️ Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or newer)
-   [Supabase](https://supabase.com/) project
-   [Polar.sh](https://polar.sh) account (optional, for payments)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/sudocore.git
    cd sudocore
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Copy `.env.example` to `.env` and fill in your Supabase credentials:
    ```bash
    cp .env.example .env
    ```

4.  **Database Setup**:
    Run migrations using the Supabase CLI or apply the SQL files from `supabase/migrations` to your Supabase project.

5.  **Start Development Server**:
    ```bash
    npm run dev
    ```

## 📦 Deployment

### Vercel
Connect your GitHub repository to Vercel. Ensure all environment variables from `.env.example` are configured in your Vercel project settings.

### Supabase
Set up a Supabase project and enable **Authentication** and **Realtime** (for collaboration rooms).

### Polar.sh Webhooks
Configure a webhook in Polar.sh pointing to `https://your-app.vercel.app/api/polar-webhook` to handle subscription updates.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

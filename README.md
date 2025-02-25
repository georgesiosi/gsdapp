# Modern Todo App with Eisenhower Matrix

A modern, feature-rich todo application built with Next.js that helps you organize tasks using the Eisenhower Matrix methodology. This app combines powerful task management features with an intuitive user interface to help you prioritize and manage your tasks effectively.

## ✨ Features

- **Eisenhower Matrix**: Organize tasks based on urgency and importance
- **Goal Setting**: Set and track your main goals and daily priorities
- **Task Management**: Add, edit, and delete tasks with ease
- **AI-Powered Sorting**: Automatically categorize tasks using OpenAI
- **Export Functionality**: Export your tasks to CSV format
- **Modern UI**: Clean and responsive design built with Tailwind CSS
- **Real-time Updates**: Instant updates as you modify tasks and goals

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- OpenAI API key for AI-powered task sorting

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mytodoapp.git
cd mytodoapp
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env.local`:
     ```bash
     cp .env.example .env.local
     ```
   - Add your OpenAI API key to `.env.local`:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: Custom components with [Radix UI](https://www.radix-ui.com)
- **Icons**: [Lucide React](https://lucide.dev)

## 📦 Project Structure

```
mytodoapp/
├── app/                # Next.js app directory
├── components/         # React components
│   ├── task-input.tsx     # Task input component
│   ├── goal-setter.tsx    # Goal setting component
│   └── eisenhower-matrix.tsx  # Matrix component
├── public/            # Static assets
└── styles/            # Global styles
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)
- Styling powered by [Tailwind CSS](https://tailwindcss.com)

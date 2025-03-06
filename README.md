# Modern Todo App with Eisenhower Matrix

A modern, feature-rich todo application built with Next.js that helps you organize tasks using the Eisenhower Matrix methodology. This app combines powerful task management features with an intuitive user interface to help you prioritize and manage your tasks effectively.

## ✨ Features

### Task Management

- **Eisenhower Matrix**: Organize tasks based on urgency and importance
- **Drag-and-Drop**: Intuitive task reordering and quadrant reassignment
- **Goal Setting**: Set and track your main goals and daily priorities
- **Task Operations**: Add, edit, and delete tasks with ease

### AI-Powered Features

- **Smart Task Analysis**: Automatically categorize tasks using OpenAI
- **Idea Detection**: Intelligent identification of ideas vs actionable tasks
- **Priority Connection**: Smart detection of ideas connected to your priorities
- **Robust Processing**: Enhanced AI response handling with fallback strategies

### Ideas Management

- **Ideas Bank**: Dedicated space for storing and managing ideas
- **Priority-Connected Ideas**: Special handling for ideas aligned with priorities
- **Idea-to-Task Conversion**: Seamlessly convert ideas into actionable tasks

### User Experience

- **Modern UI**: Clean and responsive design built with Tailwind CSS
- **Real-time Updates**: Instant feedback as you modify tasks and ideas
- **Export Functionality**: Export your tasks and ideas to CSV format

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn package manager
- OpenAI API key for AI-powered task sorting

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/gsdapp.git
cd gsdapp
```

1. Install dependencies:

```bash
npm install
# or
yarn install
```

1. Configure environment variables:

   - Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

   - Add your OpenAI API key to `.env.local`:

   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

1. Start the development server:

```bash
npm run dev
# or
yarn dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: Custom components with [Radix UI](https://www.radix-ui.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Drag and Drop**: [React DnD](https://react-dnd.github.io/react-dnd/)
- **AI Integration**: [OpenAI GPT-3.5](https://openai.com/gpt-3)
- **State Management**: React Hooks with Context API


## 📦 Project Structure

```text
gsdapp/
├── app/                # Next.js app directory
│   └── api/           # API routes including AI integration
├── components/        # React components
│   ├── task/         # Task-related components
│   │   ├── hooks/   # Task management hooks
│   │   └── ui/      # Task UI components
│   ├── ideas/        # Ideas Bank components
│   ├── ui/           # Shared UI components
│   ├── task-input.tsx    # Task input component
│   ├── goal-setter.tsx   # Goal setting component
│   └── eisenhower-matrix.tsx # Matrix component
├── lib/              # Shared utilities and helpers
├── public/           # Static assets
└── styles/           # Global styles
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)
- Styling powered by [Tailwind CSS](https://tailwindcss.com)

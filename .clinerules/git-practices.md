# Git Workflow Practices

1.  **Check Status:** Before staging or committing, always run `git status` to understand the current state of changes.
2.  **Logical Commits:** Group related file changes into single, logical commits. Avoid large, unrelated commits.
3.  **Conventional Commits:** Use the [Conventional Commits](https://www.conventionalcommits.org/) format for commit messages (e.g., `feat: ...`, `fix: ...`, `refactor: ...`, `chore: ...`, `docs: ...`).
4.  **Explicit Staging:** Prefer staging specific files (`git add <file1> <file2>...`) over staging all changes (`git add .`) unless intentionally committing everything.

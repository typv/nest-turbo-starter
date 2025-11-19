# Contributing Guide

Thank you for considering contributing to this project!  
This guide will help you get started quickly and follow the project's conventions.

## 🤝 Code of Conduct

Please review our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a respectful and inclusive environment for everyone.

---

## 🛠️ Setting Up Your Development Environment

Before you start, make sure you have the necessary tools installed (e.g., Node.js, Python, etc.).

1.  **Fork** the repository to your own GitHub account.
2.  **Clone** your forked repository:
    ```bash
    git clone https://github.com/YOUR_USERNAME/project-name.git
    cd project-name
    ```
3.  **Set up the project** and install dependencies: **Please follow the detailed instructions in the [README.md](README.md) file.**
---

## 🌱 Branching Strategy

```bash
    feature/my-feature     # new features
    fix/some-bug           # bug fixes
    chore/some-task        # internal tasks, configs, scripts
    refactor/improve-module-x  # code restructuring without changing behavior
    docs/update-readme     # documentation updates
```
---

## 📝 Commit Message Format (Conventional Commits)

```bash
    #example:
    feat: Add new login endpoint
    fix: Resolve user creation crash
    chore: Update .gitignore or scripts
    refactor: Improve auth middleware
    docs: Update README or documentation
```
---

## 🚀 Pull Request (PR) Workflow

1.  **Create Branch:** Start by creating a new local branch following the Branching Strategy (e.g., `git checkout -b feature/new-widget` from the `develop` branch).
2.  **Code & Commit:** Implement your changes and ensure your commits follow the **Commit Message Format**.
3.  **Push:** Push your branch to your forked repository:
    ```bash
    git push origin your-new-branch-name
    ```
4.  **Open PR:** Go to the original repository's GitHub/GitLab page and open a **Pull Request** **targeting the `develop` branch**.

### PR Requirements

* Clearly describe the purpose of the PR and what it addresses.
* If the PR fixes an existing issue, reference it in the description (e.g., `Closes #123`).
---

## 💬 Feedback & Feature Requests

- Open a Feature Request Issue for new ideas
- Use the Bug Report template for problems
- Discussion is welcomed in Issues and PR comments

---

Thank you for helping improve this project! 🚀
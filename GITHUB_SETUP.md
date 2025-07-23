# GitHub Setup Instructions

Your Center Pivot Irrigation Planning Tool is now ready to be pushed to GitHub. Follow these steps:

## Option 1: Using GitHub Website

1. Go to [https://github.com/new](https://github.com/new)
2. Create a new repository:
   - Repository name: `center-pivot-irrigation-tool`
   - Description: "Web-based tool for planning center pivot irrigation systems"
   - Set to Public or Private as desired
   - DO NOT initialize with README, .gitignore, or license (we already have these)

3. After creating the repository, run these commands in your project directory:

```bash
git remote add origin https://github.com/Bounty-HunteRR2/center-pivot-irrigation-tool.git
git branch -M main
git push -u origin main
```

## Option 2: Install GitHub CLI

1. Download GitHub CLI from: https://cli.github.com/
2. Install it on Windows
3. Run `gh auth login` to authenticate
4. Then run:

```bash
gh repo create center-pivot-irrigation-tool --public --source=. --remote=origin --push
```

## Option 3: Using Git Bash

If you already have a GitHub repository created:

```bash
git remote add origin https://github.com/Bounty-HunteRR2/center-pivot-irrigation-tool.git
git push -u origin master
```

## Accessing Your Application

Once pushed to GitHub, you can:

1. Enable GitHub Pages:
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main (or master)
   - Folder: / (root)
   - Save

2. Your app will be available at:
   `https://Bounty-HunteRR2.github.io/center-pivot-irrigation-tool/`

## Local Testing

To test the application locally:
1. Open `index.html` in a web browser
2. Or use a local server:
   ```bash
   python -m http.server 8000
   # Then open http://localhost:8000
   ```
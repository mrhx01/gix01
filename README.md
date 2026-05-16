# gix01

# 🔮 Gix01 (beta) – Advanced GitHub Search & Analytics

**Version 1.0.0**  
A powerful, all‑in‑one GitHub search tool with analytics, built in pure HTML/CSS/JS.  
Deploy instantly on GitHub Pages – no backend, no build step.

<img width="1366" height="607" alt="image" src="https://github.com/user-attachments/assets/1dd398ba-1172-4ae3-871d-fcbd1bc6cf09" />


## 🚀 Live Demo
👉 [https://mrhx01.github.io/Gix01](https://mrhx01.github.io/gix01)


## ✨ Features

- 🔍 **Multi‑resource search** – Repositories, Users, Issues, Code
- 📈 **Live trending repos** (last 7 days) – click any badge to search instantly
- 👥 **User deep stats** (requires token):
  - Total stars across all repos
  - Recent push commits count
  - Longest contribution streak
  - Weekly activity bar chart (Sun–Sat)
- 🎨 **Light / Dark mode** – persists locally
- 📱 **Three view modes** – Grid, Horizontal list, Compact cards
- 🔐 **GitHub token support** – store token locally (5,000 req/h vs 60 without)
- 📎 **Export results** – save search results as JSON
- 💬 **Modal popups** – for stats & error messages (no browser alerts)
- ⚡ **Pagination** – browse through up to 1,000 results


## 🧰 How to Use

1. **Open the app** – either locally or on GitHub Pages.
2. **Choose a resource** (Repos, Users, Issues, Code).
3. **Fill in filters** – keyword, stars, language, location, etc.  
   The **Custom qualifiers** field accepts any GitHub search syntax (e.g., `user:google sort:stars`).
4. **Click “Advanced Search”** – results appear instantly.
5. **For user deep stats** – paste a [GitHub Personal Access Token](https://github.com/settings/tokens)  
   (scopes: `public_repo`, `user`), then click **“Load deep stats”** on any user card.
6. **Change view** – use the Grid / Horizontal / Compact buttons.
7. **Export data** – click the footer link to download current results as JSON.


## 🔐 GitHub Token Setup (Optional but Recommended)

| Without token | With token |
|---------------|------------|
| 60 requests/hour | 5,000 requests/hour |
| No user deep stats | Full user analytics (contributions, streak, chart) |

**How to get a token**  
1. Go to [GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)  
2. Click **Generate new token (classic)**  
3. Give it a name (e.g., `Gix01`)  
4. Select scopes: `public_repo`, `user`  
5. Generate and copy the token  
6. Paste it in the token field inside the app – it will be saved in your browser.

## 🛠️ Local Development & Deployment

### Run locally
Simply open the `index.html` file in any modern browser. No server or dependencies required – Chart.js is loaded via CDN.

### Deploy on GitHub Pages
1. Fork or clone this repository.
2. Place the `index.html` file in the root (or rename it to `index.html`).
3. Go to repository **Settings → Pages**.
4. Select branch `main` (or `master`) and folder `/ (root)`.
5. Save – your site will be live at `https://<username>.github.io/<repository-name>/`.



## 🧪 Technologies Used

- HTML5 / CSS3 (CSS Grid, Flexbox, custom variables for theming)
- JavaScript (ES6+, async/await, Fetch API)
- [Chart.js](https://www.chart.js/) – for contribution charts
- GitHub REST API v3


## 🤝 Contributing

Feel free to open issues or submit pull requests. Suggestions for new filters, extra visualisations, or performance improvements are welcome!


## 📄 License

MIT – use, modify, and share as you like.

---


**Made with ❤️ for the GitHub community.**  
*Gix01 – because searching GitHub should be powerful and beautiful.*

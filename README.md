# D'Boutique 🩷

> *Do Not Settle For A Life You Do Not Deserve*

A fully client-side fashion boutique web app built with vanilla HTML, CSS, and JavaScript. No frameworks, no backend, no build tools — just open `index.html` in a browser and go.

---

## ✨ Features

### 🛍 Customer Side
- Animated landing page with leopard-print SVG logo
- Browse all products in a responsive grid
- View product details in a modal — select size, colour, and quantity
- Add to cart or buy instantly
- Full checkout flow with name, email, phone, and delivery address
- Choose **Cash on Delivery** or **Card** payment
- View active sales and announcements
- Currency switcher: USD · JMD · GBP · EUR · CAD

### 👑 Owner Side *(password protected)*
- **Upload tab** — publish new designs with image, price, category, description, sizes, colours, sale pricing, and stock status
- **Products tab** — manage live listings; toggle in/out of stock or delete
- **Orders tab** — view all customer orders with status tracking (Pending → Filled → Delivered); marking an order delivered sends a simulated notification to the customer
- **Announce tab** — post sales, restocks, and general announcements visible to customers
- **Banking tab** — save payout account details (bank account, card, PayPal, or CashApp/Venmo); view card transaction history and total revenue

---

## 📁 File Structure

```
dboutique/
├── index.html    # All markup and DOM structure
├── style.css     # All styling, animations, and colour variables
├── script.js     # All logic — state, rendering, cart, orders, banking
└── README.md     # This file
```

---

## 🚀 Getting Started

### Run locally
No server required. Just open the file directly:

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/dboutique.git
cd dboutique

# Open in browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

### Deploy to GitHub Pages
1. Push the repo to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Your site will be live at `https://YOUR_USERNAME.github.io/dboutique`

---

## 🔐 Owner Access

Click **Owner Login** on the landing screen and enter the password.

> ⚠️ Change the password in `script.js` before deploying:
> ```js
> // Find this line in script.js and replace with your own password
> if (val === 'YOUR_PASSWORD_HERE') {
> ```

---

## 💾 Data Storage

All data is stored in the browser's **localStorage** — no database or server needed.

| Key | Contents |
|---|---|
| `db_products` | All uploaded product listings |
| `db_orders` | All customer orders |
| `db_anns` | Announcements and sale posts |
| `db_cart` | Current cart contents |
| `db_currency` | Selected display currency |
| `db_banking` | Owner payout account details |

> **Note:** Data is stored per browser per device. For a shared/persistent store, the `localStorage` calls in `script.js` can be swapped out for any REST API or database.

---

## 🎨 Colour Palette

| Variable | Hex | Use |
|---|---|---|
| `--cream` | `#FEEAC9` | Page background |
| `--blush` | `#FFCDC9` | Cards, hover states |
| `--rose` | `#FDACAC` | Borders, secondary elements |
| `--coral` | `#FD7979` | Accents, prices |
| `--hot-pink` | `#FF2D87` | Primary CTA, glows |
| `--deep-pink` | `#D81B7A` | Headings, active states |
| `--black` | `#0a0a0a` | Header, cards on dark bg |

---

## 🖋 Fonts

Loaded from Google Fonts (requires internet connection):

- **Bebas Neue** — headings, logo, price tags
- **Playfair Display** — product names, tagline
- **DM Sans** — body text, buttons, labels

---

## 🛠 Customisation

### Change the logo
The logo is an inline SVG in `index.html` inside `<div class="svg-logo-wrap">`. Edit the `<text>` elements and `<polygon>` star points directly, or swap the whole block for an `<img>` tag.

### Change the leopard texture
The pink leopard pattern is embedded as a base64 WebP image inside the SVG `<pattern id="leopardPat">` in `index.html`. Replace the `href` value with a new base64-encoded image or a URL.

### Add product categories
Edit the `<select id="pCategory">` in `index.html`:
```html
<option>Your New Category</option>
```

### Add currencies
Edit both the `RATES` and `SYMBOLS` objects in `script.js`:
```js
const RATES   = { USD:1, JMD:156, GBP:0.79, EUR:0.93, CAD:1.37, TTD:6.75 };
const SYMBOLS = { USD:'$', JMD:'J$', GBP:'£', EUR:'€', CAD:'CA$', TTD:'TT$' };
```
Then add the option to both currency `<select>` elements in `index.html`.

---

## 📋 Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, animations) |
| Logic | Vanilla JavaScript (ES6+) |
| Storage | Browser localStorage |
| Fonts | Google Fonts |
| Hosting | Any static host (GitHub Pages, Netlify, Vercel) |

---

## 📄 License

MIT — free to use, modify, and distribute.

---

*Built with 🩷 for D'Boutique — because you deserve better.*

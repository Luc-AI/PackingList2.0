# PackList 2.0

A modern, responsive, and easy-to-use packing list application designed to make travel preparation stress-free.

## Features

- **📝 Smart List Management**: Add items quickly, edit them inline, and check them off as you pack.
- **🤏 Drag & Drop**: Easily reorder items with a smooth drag-and-drop interface (powered by SortableJS).
- **🌓 Dark Mode**: Automatic system theme detection with a manual toggle for Day/Night modes.
- **💾 Auto-Save**: Your list is automatically saved to your browser's local storage—never lose your progress.
- **📊 Progress Tracking**: Visual progress bar shows exactly how much you have left to pack.
- **📱 Mobile-First Design**: Optimized for touch interaction with a sticky input bar and large touch targets.
- **⚡ No Install Needed**: Pure Vanilla JavaScript with zero dependencies—runs instantly in any browser.

## Getting Started

Because this project uses vanilla web technologies, there are no build steps or complex installation requirements.

### Running Locally

1. **Clone or Download** the repository.
2. **Open `index.html`** in your preferred web browser.
   - *That's it!* The app works completely offline (once the CDN for SortableJS is cached).

For the best experience (especially for mobile testing), you can serve the folder using a local static server:

```bash
# Example with Python
python3 -m http.server

# Example with Node.js http-server
npx http-server .
```

## Technologies Used

- **HTML5**: Semantic structure.
- **CSS3**: Variables for theming, Flexbox for layout, and Glassmorphism effects.
- **Vanilla JavaScript**: Core logic, DOM manipulation, and state management.
- **SortableJS**: (via CDN) for touch-friendly drag-and-drop functionality.
- **LocalStorage**: For client-side data persistence.

## Project Structure

```
Packlist2.0/
├── index.html      # Main entry point and UI structure
├── style.css       # All styles, themes, and responsive design
└── script.js       # App logic: state, events, and persistence
```

## Browser Support

Works on all modern browsers (Chrome, Safari, Firefox, Edge) with support for:
- CSS Custom Properties (Variables)
- LocalStorage
- ES6 JavaScript features

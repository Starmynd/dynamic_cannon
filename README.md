# Dynamic Cannon

A small browser game — single-file HTML5 canvas shooter with sound.

- No build step, no dependencies: everything is one `index.html` (~22 KB of JS/CSS/HTML)
- Works on desktop (keyboard) and mobile (touch)
- Background music and hit sound effects are included as mp3 assets

## Run

Just open `index.html` in a browser:

```bash
git clone https://github.com/Starmynd/dynamic_cannon.git
cd dynamic_cannon
open index.html        # macOS
# or: xdg-open index.html (Linux)
```

Or serve it:

```bash
python3 -m http.server 8000
# -> http://localhost:8000
```

## Structure

```
index.html              # the whole game (canvas, logic, styles)
background_music.mp3    # background music
hit.mp3                 # hit sound effect
```

## License

[MIT](LICENSE)

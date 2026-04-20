# Queue Receiver for Spicetify

**Add songs to your Spotify queue from a Python server!** Seamlessly integrated into Spotify via Spicetify.

This lightweight extension adds a small button in Spotify's top bar. Clicking it opens a clean, draggable settings panel where you can configure your local Python queue server's address. The extension then polls the server every 2 seconds and automatically adds any returned Spotify track to your queue.

Perfect for home automation, custom scripts, or pushing tracks to Spotify from external services.

## Features

- Native-looking draggable settings panel that matches Spotify's design
- Persistent host & port configuration (saved in localStorage)
- Automatic polling of your Python server (`/poll` endpoint)
- Adds tracks using `Spicetify.addToQueue`
- User-friendly notifications
- Silently handles connection issues when the server is offline
- Top-bar button with queue/add icon
- Settings changes apply immediately (no reload needed)

## Requirements

- [Spicetify](https://spicetify.app/) installed
- Spotify desktop client
- A running Python server with a `/poll` endpoint returning JSON in this format:
  ```json
  {
    "spotify_track": "spotify:track:xxxxxxxxxxxxxxxxxxxxxx"
  }
  ```
  (Return `null` or omit the key when there's nothing to add)

## Installation

1. Download `queue-receiver.js` from the Releases tab (or copy the script).
2. Create the folder:
   - **Windows**: `%appdata%\spicetify\Extensions\queue-receiver\`
   - **macOS / Linux**: `~/.config/spicetify/Extensions/queue-receiver/`
3. Place the file inside as `queue-receiver.js`.
4. Enable it:
   ```bash
   spicetify config extensions queue-receiver.js
   spicetify apply
   ```
5. Restart Spotify.

A small queue icon will appear in the top right. Click it to configure your server.

## Usage

- Click the 🎵 button in the top bar
- Set your server's **Host** (default: `127.0.0.1`) and **Port** (default: `5000`)
- Click **Save & Apply**
- The extension will start polling `http://your-host:port/poll` every 2 seconds
- Any valid track returned will be added to your current queue with a notification

The panel is draggable and remembers its position.

## Python Server Example (Minimal)

```python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/poll')
def poll():
    # Your logic here (queue, database, MQTT, etc.)
    next_track = "spotify:track:4uLU6hMCjMI75M1A2tKUQC"  # example
    return jsonify({"spotify_track": next_track})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)
```

## Changelog

### v1.0.0
- Initial release
- Draggable React settings panel
- Reliable top-bar button injection
- Robust polling and error handling

## Contributing

Feel free to open issues or pull requests. Possible improvements:
- Configurable poll interval
- Add to playlist instead of queue
- Connection status indicator
- Bulk queue support

## License

MIT License

---

**Made for the Spicetify & home automation community**

If you're using this with your own setup, I'd love to hear about it!  
Star the repo ⭐ if it helps you out.

---

That's it. Paste the above into your `README.md` and it should display correctly on GitHub.

If you still have trouble, tell me exactly what you see when you paste it (e.g. "it shows HTML tags" or "formatting is broken"). I'll adjust accordingly.

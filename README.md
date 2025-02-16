# Chris Sound Module

## Overview
The Chris Sound Module is a Foundry VTT module designed to enhance sound management for tabletop role-playing games. This module introduces a user-friendly interface, the SoundPad, allowing Game Masters (GMs) to easily play and manage sounds for specific players, creating a more immersive experience.

---

## Features

- **SoundPad Interface**: A graphical interface to select and manage sounds without relying on macros.
- **Play Sounds for Specific Players**: GMs can play sounds for a particular player without others hearing it.
- **Custom Notifications**: Provides feedback and notifications on successful sound playback and any errors.
- **Logging Options**: Enable or disable console logs for debugging through module settings.
- **Configurable Volume Control**: Adjust sound volumes dynamically for individual players.
- **Drag-and-Drop Support**: Easily add sounds to the SoundPad by dragging them from playlists.

---

## Installation

1. **Download the latest release**: Obtain the latest version from the [Releases](https://github.com/Chrisrous/Chris-Sound-Module/releases) page.
2. **Activate the module**: Go to **World Settings** in Foundry VTT and enable "Chris Sound Module."

---

## Usage

### SoundPad Interface
1. Open the SoundPad via the module settings menu.
2. Drag and drop sounds from playlists into the SoundPad.
3. Select a sound and a player, then use the Play button to play the sound for the chosen player.
4. Use the volume slider to adjust the playback volume dynamically.
5. Stop all sounds or remove sounds from the interface as needed.

### Legacy Macro Support
For users who prefer macros, the module still supports the `playSoundForPlayer` function. This function takes three arguments: `playerName`, `playlistName`, and `songName`.

**Example Macro:**
```javascript
const playerName = "Player6"; // Player's name
const playlistName = "Ambient Sounds"; // Playlist name
const songName = "Tor"; // Song name

playSoundForPlayer(playerName, playlistName, songName);
```
Save the macro and add it to your hotbar. Execute the macro to play the sound for the specified player.

---

## Troubleshooting

1. **Verify Names:** Ensure that player names, playlist names, and song names match exactly with those in your Foundry VTT setup.
2. **Check Logs:** Enable console logging in the module settings and check the logs for detailed error messages.
3. **Compatibility:** Ensure you are using the latest version of the module and Foundry VTT.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## Credits

Developed by Chrisrous.

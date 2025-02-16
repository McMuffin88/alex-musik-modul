// Erweiterung des SoundPad zur Unterstützung von Play, Stop und Lautstärke
export let enableLogging = false; // Standardmäßig deaktiviert

// Funktion zur Aktualisierung der Logging-Einstellungen
Hooks.once("init", () => {
  game.settings.register("chris-sound-module", "enableLogging", {
    name: "Konsolen-Logs aktivieren",
    hint: "Aktiviert oder deaktiviert Konsolen-Logs für das SoundPad.",
    scope: "client", // Nur für den aktuellen Client
    config: true,
    default: false, // Standardmäßig deaktiviert
    type: Boolean,
    onChange: value => {
      enableLogging = value; // Aktualisiert die Variable
    }
  });

  // Initialer Wert aus den Einstellungen laden
  enableLogging = game.settings.get("chris-sound-module", "enableLogging");
});

// Hilfsfunktion für konsolenbasiertes Logging
function logMessage(message, ...optionalParams) {
  if (enableLogging) {
    console.log(message, ...optionalParams);
  }
}

class SoundPad extends FormApplication {
  constructor(options = {}) {
    super(options);
    this.sounds = []; // Zentrale Datenstruktur für Sounds
    this.selectedSoundId = null; // ID des aktuell ausgewählten Sounds
    this.selectedSoundName = null; // Name des aktuell ausgewählten Sounds
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "soundpad",
      title: "SoundPad",
      template: "modules/chris-sound-module/templates/soundpad.html",
      width: 500,
      height: 400,
      resizable: true,
      dragDrop: [{ dragSelector: ".soundpad-drop-area", dropSelector: null }], // Drag-and-Drop aktivieren
    });
  }

  activateListeners(html) {
    // Aktiviert die Listener der Basisklasse und fügt spezifische Listener für das SoundPad hinzu.
    super.activateListeners(html);

    // Spieler-Auswahl Dropdown
    const playerSelect = html.find(".player-select .player-option");

    console.log("Gefundene Checkbox-Elemente:", playerSelect);

    playerSelect.each(function () {
      console.log("Checkbox Wert:", this.value, "Status:", this.checked);
    });





    // Debugging: Verfügbare Spieler anzeigen
    logMessage("Verfügbare Spieler:", game.users.contents.map((u) => u.name));

    // Sound auswählen
    html.find(".sound-button").click((event) => {
      // Dieser Block verarbeitet die Auswahl eines Sounds durch den Nutzer.
      // Es wird die ID und der Name des ausgewählten Sounds gespeichert und die Anzeige aktualisiert.
      const button = event.currentTarget;
      this.selectedSoundId = button.dataset.soundId;
      this.selectedSoundName = button.dataset.soundName;

      logMessage(`Sound ${this.selectedSoundName} ausgewählt (ID: ${this.selectedSoundId})`);

      // Entferne "active"-Klasse von allen Sound-Buttons
      html.find(".sound-button").removeClass("active");
      // Füge "active"-Klasse nur beim aktuellen Button hinzu
      $(button).addClass("active");

      // Aktualisiere die Anzeige für den aktuell ausgewählten Sound
      html.find(".selected-sound-display").text(`Aktueller Sound: ${this.selectedSoundName}`);
    });

    // Play-Button
    html.find(".play-button").click(() => {
      // Klick auf den Play-Button spielt den aktuell ausgewählten Sound für den ausgewählten Spieler ab.
      playerSelect.each(function () {
        console.log("Checkbox Wert:", this.value, "Status:", this.checked);
      });
      console.log("Aktuell ausgewählte Spieler:", playerSelect.val());

      if (!this.selectedSoundId || !this.sounds[this.selectedSoundId]) {
        console.error("Bitte zuerst einen Sound auswählen.");
        return;
      }

      const soundData = this.sounds[this.selectedSoundId];
      logMessage("Sound wird abgespielt:", soundData);

      const playerName = playerSelect.val();
      if (!playerName) {
        console.warn("Bitte einen Spieler auswählen.");
        return;
      }

      playSoundForPlayer(playerName, soundData.playlist, soundData.name);
    });

    // Stop-Button
    html.find(".stop-button").click(() => {
      // Dieser Block sendet den Stop-Befehl an den aktuell ausgewählten Spieler, um die Wiedergabe des Sounds zu beenden.
      const playerName = playerSelect.val();

      if (!playerName) {
        console.warn("Bitte einen Spieler auswählen.");
        return;
      }

      logMessage(`Sende Stop-Befehl an Spieler '${playerName}'`);
      controlSoundForPlayer(playerName, 'stopSound');
    });

    // Lautstärkeregler
    html.find("#volume-slider").on("input", (event) => {
      // Dieser Block verarbeitet den Lautstärkeregler und passt die Lautstärke für den ausgewählten Spieler entsprechend an.
      const volume = parseFloat(event.target.value);
      const playerName = playerSelect.val();

      if (!playerName) {
        console.warn("Bitte einen Spieler auswählen.");
        return;
      }

      logMessage(`Ändere Lautstärke auf ${volume} für Spieler '${playerName}'`);
      changeVolumeForPlayer(playerName, volume);
    });

    // Button: Alle Sounds entfernen
    html.find(".clear-sounds").click(() => {
      logMessage("Alle Sounds werden entfernt.");
      this.sounds = []; // Leere die zentrale Datenstruktur
      this.render(true); // Aktualisiere die Ansicht
    });

    // Debugging: Überprüfe Buttons nach Initialisierung
    html.find(".sound-button").each((index, button) => {
      logMessage("Initialisierter Button:", {
        soundId: button.dataset.soundId,
        soundName: button.dataset.soundName,
      });
    });
  }

  /**
   * Bereitet die Daten für die Anzeige in der Benutzeroberfläche des SoundPads vor.
   * Liefert eine Liste von Sounds und die verfügbaren Benutzer im Spiel.
   */
  getData() {
    const users = game.users.contents.map((user) => ({ name: user.name }));
    return { sounds: this.sounds, users };
  }

  /**
   * Diese Methode verarbeitet das Drag-and-Drop-Event für Sounds.
   * Es wird überprüft, ob die Daten gültig sind und ein Sound aus einer Playlist hinzugefügt werden kann.
   * Die hinzugefügten Sounds werden in der zentralen Datenstruktur gespeichert und die Ansicht wird aktualisiert.
   */
  async _onDrop(event) {
    event.preventDefault();

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
      logMessage("Daten aus Drag-and-Drop-Event:", data); // Debugging-Ausgabe
    } catch (err) {
      console.error("Fehler beim Verarbeiten der Drag-and-Drop-Daten:", err);
      return;
    }

    if (data.type === "PlaylistSound") {
      const uuidParts = data.uuid.split(".");
      const playlistId = uuidParts[1];
      const soundId = uuidParts[3];

      const playlist = game.playlists.get(playlistId);
      if (!playlist) {
        console.error("Playlist nicht gefunden:", playlistId);
        return;
      }

      const sound = playlist.sounds.get(soundId);
      if (!sound) {
        console.error("Sound nicht gefunden in Playlist:", soundId);
        return;
      }

      this.sounds.push({
        name: sound.name,
        src: sound.path,
        playlist: playlist.name, // Playlist-Name hinzufügen
      });

      logMessage("Aktualisierte Sounds-Liste nach Hinzufügen:", this.sounds); // Debugging hinzugefügt
      this.sounds.forEach((sound, index) => {
        logMessage(`Sound #${index}: Name=${sound.name}, Pfad=${sound.src}, Playlist=${sound.playlist}`);
      });

      logMessage(`Sound "${sound.name}" hinzugefügt:`, sound);
      this.render(true);
    } else {
      console.warn("Ungültiger Typ für Drag-and-Drop-Daten:", data.type);
    }
  }
}

Hooks.once("ready", () => {
  if (!game.user.isGM) {
    console.warn("SoundPad ist nur für GMs verfügbar.");
    return;
  }

  game.settings.registerMenu("chris-sound-module", "soundpad", {
    name: "SoundPad öffnen",
    label: "SoundPad",
    icon: "fas fa-music",
    type: SoundPad,
    restricted: true, // Nur GMs können das SoundPad öffnen
  });

  window.soundPad = new SoundPad();
});

window.SoundPad = SoundPad;
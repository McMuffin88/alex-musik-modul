// Erweiterung des Niclex Modules zur Unterstützung von Play, Stop und Lautstärke
export let enableLogging = false; // Standardmäßig deaktiviert

// Funktion zur Aktualisierung der Logging-Einstellungen
Hooks.once("init", () => {
  game.settings.register("chris-sound-module", "enableLogging", {
    name: "Konsolen-Logs aktivieren",
    hint: "Aktiviert oder deaktiviert Konsolen-Logs für das Niclex Modul.",
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
      title: "Niclex Musik Modul",
      template: "modules/chris-sound-module/templates/soundpad.html",
      width: 500,
      height: 400,
      resizable: true,
      dragDrop: [{ dragSelector: ".soundpad-drop-area", dropSelector: null }], // Drag-and-Drop aktivieren
    });
  }

  activateListeners(html) {
    // Aktiviert die Listener der Basisklasse und fügt spezifische Listener für das Niclex Modules hinzu.
    super.activateListeners(html);

    // Spieler-Auswahl Dropdown
    const playerSelect = html.find(".player-select .player-option");

    // Funktion innerhalb von activateListeners definieren
    function getSelectedPlayers() {
      let selectedPlayers = [];
      playerSelect.each(function () {
        if (this.checked) {
          selectedPlayers.push(this.value);
        }
      });
      return selectedPlayers;
    }


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
      // Test: Gibt die ausgewählten Spieler in der Konsole aus
      console.log("Gefundene Checkbox-Elemente:", playerSelect);
      console.log("Ausgewählte Spieler:", getSelectedPlayers());

      if (!this.selectedSoundId || !this.sounds[this.selectedSoundId]) {
        console.error("Bitte zuerst einen Sound auswählen.");
        return;
      }

      const soundData = this.sounds[this.selectedSoundId];
      logMessage("Sound wird abgespielt:", soundData);

      // Holt die Liste der ausgewählten Spieler
      const selectedPlayers = getSelectedPlayers();

      if (selectedPlayers.length === 0) {
        console.warn("Bitte mindestens einen Spieler auswählen.");
        return;
      }

      // Für jeden ausgewählten Spieler den Sound abspielen
      selectedPlayers.forEach(playerName => {
        playSoundForPlayer(playerName, soundData.playlist, soundData.name);
        logMessage(`Sound für Spieler ${playerName} gestartet.`);
      });
    });

// Stop-Button
html.find(".stop-button").click(() => {
  // Test: Gibt die ausgewählten Spieler in der Konsole aus
  console.log("Gefundene Checkbox-Elemente:", playerSelect);
  console.log("Ausgewählte Spieler:", getSelectedPlayers());

  // Holt die Liste der ausgewählten Spieler
  const selectedPlayers = getSelectedPlayers();

  if (selectedPlayers.length === 0) {
      console.warn("Bitte mindestens einen Spieler auswählen.");
      return;
  }

  // Für jeden ausgewählten Spieler den Stop-Befehl senden
  selectedPlayers.forEach(playerName => {
      controlSoundForPlayer(playerName, 'stopSound');
      logMessage(`Stop-Befehl für Spieler ${playerName} gesendet.`);
  });
});

// Lautstärkeregler
html.find("#volume-slider").on("input", (event) => {
  const volume = parseFloat(event.target.value);

  // Holt die Liste der ausgewählten Spieler
  const selectedPlayers = getSelectedPlayers();

  if (selectedPlayers.length === 0) {
      console.warn("Bitte mindestens einen Spieler auswählen.");
      return;
  }

  // Für jeden ausgewählten Spieler die Lautstärke anpassen
  selectedPlayers.forEach(playerName => {
      changeVolumeForPlayer(playerName, volume);
      logMessage(`Lautstärke für Spieler ${playerName} auf ${Math.round(volume * 100)}% gesetzt.`);
  });
});

// Master-Lautstärkeregler
html.find("#master-volume-slider").on("input", (event) => {
  const volume = parseFloat(event.target.value);

  // Holt ALLE Spieler aus der Spieler-Liste
  const allPlayers = game.users.contents.map(user => user.name);

  // Für jeden Spieler die Lautstärke anpassen
  allPlayers.forEach(playerName => {
      changeVolumeForPlayer(playerName, volume);
      logMessage(`Master-Lautstärke für Spieler ${playerName} auf ${Math.round(volume * 100)}% gesetzt.`);
  });
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
   * Bereitet die Daten für die Anzeige in der Benutzeroberfläche des Niclex Modules vor.
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
    console.warn("Niclex Modul ist nur für GMs verfügbar.");
    return;
  }

  game.settings.registerMenu("chris-sound-module", "Niclex Modul", {
    name: "Nixlex Musik Modul öffnen",
    label: "Nixlex Musik Modul",
    icon: "fas fa-music",
    type: SoundPad,
    restricted: true, // Nur GMs können das Niclex Modul öffnen
  });

  window.soundPad = new SoundPad();
});

Hooks.on("renderPlaylistDirectory", (app, html, data) => {
  // Erst prüfen, ob der User ein GM ist (optional)
  if (!game.user.isGM) return;

      // Prüfen, ob der Button bereits existiert
      if (html.find(".soundpad-button").length > 0) return;

  // Neuen Button für das Niclex Modul erstellen
  const soundPadButton = $(`
      <button class="soundpad-button" style="margin: 5px; width: 100%;">
          🎵 Niclexmodul öffnen
      </button>
  `);

  // Event Listener für den Button hinzufügen
  soundPadButton.click(() => {
      new SoundPad().render(true);
  });

  // Button an die Liste der Wiedergabelisten anhängen
  html.find(".directory-header").append(soundPadButton);
});



window.SoundPad = SoundPad;

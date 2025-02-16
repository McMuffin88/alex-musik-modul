// Erweiterung des SoundPad zur Unterstützung von Play, Stop und Lautstärke
export let enableLogging = false; // Standardmäßig deaktiviert

// Funktion zur Aktualisierung der Logging-Einstellungen
Hooks.once("init", () => {
  game.settings.register("alex-musik-modul", "enableLogging", {
    name: "Konsolen-Logs aktivieren",
    hint: "Aktiviert oder deaktiviert Konsolen-Logs für das Alex Musik Modul.",
    scope: "client",
    config: true,
    default: false,
    type: Boolean,
    onChange: value => {
      enableLogging = value;
    }
  });

  enableLogging = game.settings.get("alex-musik-modul", "enableLogging");
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
    this.selectedCharacters = new Set(); // Set für ausgewählte Charaktere
    this.selectedSoundId = null; // ID des aktuell ausgewählten Sounds
    this.selectedSoundName = null; // Name des aktuell ausgewählten Sounds
  }

  // Sicherstellen, dass `sounds` nicht verloren geht
  async getData() {
    const data = await super.getData();

    // Stelle sicher, dass die Sounds-Liste erhalten bleibt
    if (!this.sounds) {
      this.sounds = [];
    }
    data.sounds = this.sounds;

    data.users = game.users.contents.map(user => ({
      id: user.id,
      name: user.name
    }));

    console.log("Aktuelle Daten in getData():", data); // Debugging

    return data;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "soundpad",
      title: "SoundPad",
      template: "modules/alex-musik-modul/templates/soundpad.html",
      width: 500,
      height: 400,
      resizable: true,
      dragDrop: [{ dragSelector: ".soundpad-drop-area", dropSelector: null }] // Drag-and-Drop aktivieren
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    console.log("Sounds vor Drag-and-Drop:", this.sounds);

    // Stelle sicher, dass das Element existiert
    const characterSelection = html.find("#character-selection");

    if (characterSelection.length === 0) {
      console.error("Fehler: #character-selection existiert nicht.");
      return;
    }

    console.log("Character Selection gefunden, fülle Checkboxen...");
    characterSelection.empty(); // Lösche alte Einträge, falls vorhanden

    game.users.contents.forEach(user => {
      const label = $(`<label><input type="checkbox" class="character-checkbox" value="${user.name}"> ${user.name}</label>`);
      characterSelection.append(label);
    });
    

    console.log("Spieler-Checkboxen wurden eingefügt:", characterSelection.html());

    // Checkbox-Eventlistener für Charakterauswahl
    const checkboxes = html.find(".character-checkbox");

    checkboxes.each((_, checkbox) => {
      $(checkbox).on("change", (event) => {
        if (event.target.checked) {
          this.selectedCharacters.add(event.target.value);
        } else {
          this.selectedCharacters.delete(event.target.value);
        }
        console.log("Ausgewählte Charaktere:", Array.from(this.selectedCharacters));
      });
    });

    logMessage("Verfügbare Spieler:", game.users.contents.map((u) => u.name));

    // Sound auswählen
    html.find(".sound-button").click((event) => {
      const button = event.currentTarget;
      this.selectedSoundId = button.dataset.soundId;
      this.selectedSoundName = button.dataset.soundName;

      logMessage(`Sound ${this.selectedSoundName} ausgewählt (ID: ${this.selectedSoundId})`);

      html.find(".sound-button").removeClass("active");
      $(button).addClass("active");

      html.find(".selected-sound-display").text(`Aktueller Sound: ${this.selectedSoundName}`);
    });

    // Play-Button für mehrere Charaktere
    html.find(".play-button").click(() => {
      if (!this.selectedSoundId || !this.sounds[this.selectedSoundId]) {
        console.error("Bitte zuerst einen Sound auswählen.");
        return;
      }

      const soundData = this.sounds[this.selectedSoundId];
      logMessage("Sound wird abgespielt:", soundData);

      const selectedPlayers = Array.from(this.selectedCharacters);
      if (selectedPlayers.length === 0) {
        console.warn("Bitte mindestens einen Spieler auswählen.");
        return;
      }

      selectedPlayers.forEach(playerName => {
        playSoundForPlayer(playerName, soundData.playlist, soundData.name);
      });
    });

    // Stop-Button für mehrere Charaktere
    html.find(".stop-button").click(() => {
      const selectedPlayers = Array.from(this.selectedCharacters);
      if (selectedPlayers.length === 0) {
        console.warn("Bitte mindestens einen Spieler auswählen.");
        return;
      }

      selectedPlayers.forEach(playerName => {
        logMessage(`Sende Stop-Befehl an Spieler '${playerName}'`);
        controlSoundForPlayer(playerName, 'stopSound');
      });
    });

    // Lautstärkeregler für mehrere Charaktere
    html.find("#volume-slider").on("input", (event) => {
      const volume = parseFloat(event.target.value);
      const selectedPlayers = Array.from(this.selectedCharacters);
      if (selectedPlayers.length === 0) {
        console.warn("Bitte mindestens einen Spieler auswählen.");
        return;
      }

      selectedPlayers.forEach(playerName => {
        logMessage(`Ändere Lautstärke auf ${volume} für Spieler '${playerName}'`);
        changeVolumeForPlayer(playerName, volume);
      });
    });
 

      // Button: Alle Sounds entfernen
      html.find(".clear-sounds").click(() => {
        logMessage("Alle Sounds werden entfernt.");
        this.sounds = []; // Leere die zentrale Datenstruktur
        this.render(true); // Aktualisiere die Ansicht
      });

    }

  // Drag-and-Drop-Funktion
  async _onDrop(event) {
    event.preventDefault();

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData("text/plain"));
      logMessage("Daten aus Drag-and-Drop-Event:", data);
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
        playlist: playlist.name
      });

      logMessage(`Sound "${sound.name}" hinzugefügt:`, sound);
      this.render(true);
    } else {
      console.warn("Ungültiger Typ für Drag-and-Drop-Daten:", data.type);
    }
  }
}

Hooks.once("ready", () => {
  window.soundPad = new SoundPad();
});

// Änderung - 2025-02-16 14:30:00 UTC: Button nur im Wiedergabelisten-Reiter anzeigen
Hooks.on("renderPlaylistDirectory", (app, html, data) => {
  // Falls der Button schon existiert, nicht erneut hinzufügen (verhindert doppelte Buttons)
  if (html.find(".alex-musik-modul-button").length) return;

  const button = $(`
      <button class="alex-musik-modul-button">
          <i class="fas fa-music"></i> Alex Musikmodul
      </button>
  `);

  // Button oberhalb der Wiedergabelisten hinzufügen
  html.find(".directory-header").append(button);

  // Klick-Event hinzufügen, um das Musikmodul zu öffnen
  button.click(() => {
      new SoundPad().render(true);
  });

  console.log("Alex Musikmodul Button zur Wiedergabeliste hinzugefügt.");
});

window.SoundPad = SoundPad;


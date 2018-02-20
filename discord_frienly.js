const client = require("discord-rich-presence")("415207119642689544");
const dbus = require("dbus-native");
const sessionBus = dbus.sessionBus();
const serviceName = "org.mpris.MediaPlayer2.rhythmbox";
const interfaceName = "org.mpris.MediaPlayer2.Player";
const objectPath = "/org/mpris/MediaPlayer2";
const propIfaceName = "org.freedesktop.DBus.Properties"
var metadata;
var pos;
var savedArtist;
var savedTitle;

if (!sessionBus) {
  throw new Error("Could not connect to the DBus session bus.");
}

const service = sessionBus.getService(serviceName);

service.getInterface(objectPath, interfaceName, (err, iface) => {
  if (err) {
    console.error(
      `Failed to request interface "${interfaceName}" at "${objectPath}" : ${
        err
      }`
        ? err
        : "(no error)"
    );
    process.exit(1);
  }
  
  iface.Metadata((err, str) => {
    if (err) {
      console.error(`Error while calling Metadata: ${err}`);
    }
    else {
      metadata = str
      title = metadata.find(function(element) {
        return element.toString().startsWith("xesam:title,[object Object]");
      });
      artist = metadata.find(function(element) {
        return element.toString().startsWith("xesam:artist,[object Object],");
      });
      savedArtist = artist.toString().replace("xesam:artist,[object Object],", "");
      savedTitle = title.toString().replace("xesam:title,[object Object],", "");
      console.log(title + artist);
      client.updatePresence({
        state: artist.toString().replace("xesam:artist,[object Object],", ""),
        details: title.toString().replace("xesam:title,[object Object],", ""),
        largeImageKey: "rhythmbox",
        smallImageKey: "play",
        instance: true,
      });
    }
  });
});

service.getInterface(objectPath, propIfaceName, (err, iface) => {
  if (err) {
    console.error(
      `Failed to request interface "${interfaceName}" at "${objectPath}" : ${
        err
      }`
        ? err
        : "(no error)"
    );
    process.exit(1);
  }
  
  iface.on("PropertiesChanged", function(msg, data) {
    meta = data.find(function(element) {
      return element.toString().startsWith("Metadata,[object Object],");
    });
    var status;
    if (!meta) {
      console.log("DEBUG: data is: " + data.toString());
      if (data.toString().includes("PlaybackStatus,[object Object],")) {
        console.log("Change, but metadata was not updated");
        service.getInterface(objectPath, interfaceName, (err, iface) => {
          iface.PlaybackStatus((err, str) => {
            console.log(str);
            switch (str) {
              case "Playing":
                console.log("WE ARE PLAYING");
                client.updatePresence({
                  state: savedArtist,
                  details: savedTitle,
                  largeImageKey: "rhythmbox",
                  smallImageKey: "pause",
                  instance: true,
                });    
                break;            
              case "Paused":
                console.log("WE ARE PAUSED");
                client.updatePresence({
                  state: savedArtist,
                  details: savedTitle,
                  largeImageKey: "rhythmbox",
                  smallImageKey: "pause",
                  instance: true,
                });    
                break;
              case "Stopped":
                console.log("WE ARE STOPPED");
                client.updatePresence({
                  state: "By TopKek",
                  details: "Rhythmbox RPC",
                  largeImageKey: "rhythmbox",
                  smallImageKey: "stop",
                  instance: true,
                });    
                break;
            }
          });
        });
      }

      else {
        console.log("Change, but playbackstatus was not updated");
      }
    }
    else {
      var metaStr = meta[1].toString();
      console.log("---META---\n" + meta[1] + "\n---END META---");
      title = metaStr.substring(metaStr.indexOf(",xesam:title,[object Object],") + 29, metaStr.indexOf(",xesam:artist,"));
      console.log("title: " + title);
      artist = metaStr.substring(metaStr.indexOf(",xesam:artist,[object Object],") + 30, metaStr.indexOf(",xesam:album,"));
      console.log("artist: " + artist);
      if (!title || !artist) {
        console.log("Change, but title and artist was not changed.");
      }
      else {
        savedArtist = artist;
        savedTitle = title;
        client.updatePresence({
          state: artist,
          details: title,
          largeImageKey: "rhythmbox",
          smallImageKey: "play",
          instance: true,
        });      
      }
    }
  });  
});


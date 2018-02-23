const client = require("discord-rich-presence")("415207119642689544");
const dbus = require("dbus-native");
const sessionBus = dbus.sessionBus();
const serviceName = "org.mpris.MediaPlayer2.rhythmbox";
const interfaceName = "org.mpris.MediaPlayer2.Player";
const objectPath = "/org/mpris/MediaPlayer2";
const propIfaceName = "org.freedesktop.DBus.Properties";
const playlistIfaceName = "org.mpris.MediaPlayer2.Playlists";
var metadata;
var savedAlbum;
var savedDetails;
var savedLargeImgText;
var timestamp = Math.floor(Date.now() / 1000);

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
  console.log("Connected");
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
      album = metadata.find(function(element) {
        return element.toString().startsWith("xesam:album,[object Object],");
      });
      service.getInterface(objectPath, playlistIfaceName, (err, iface) => {
        iface.ActivePlaylist((err, str) => {
          if (str) {
            var largeImgText = "Playlist: " + str[1].toString().split(",")[1];
            savedLargeImgText = largeImgText;
            console.log(str[1].toString().split(",")[1]);
          }
          else {
            console.log("No playlist");        
          }
         if (!title && !artist && !album) {
           client.updatePresence({
             state: "By TopKek - https://github.com/ToppleKek/rhythmbox-discord",
             details: "Rhythmbox RPC",
             largeImageKey: "rhythmbox",
             smallImageKey: "stop",
             smallImageText: "Stopped",
             instance: true,
           });        
         }
         else {
           savedAlbum = album.toString().replace("xesam:album,[object Object],", "").substring(0, 128);
           var details = title.toString().replace("xesam:title,[object Object],", "") + " - " + artist.toString().replace("xesam:artist,[object Object],", "");
           savedDetails = details.substring(0, 128);
           console.log(title + artist + album);
           client.updatePresence({
             state: album.toString().replace("xesam:album,[object Object],", "").substring(0, 128),
             details: details.substring(0, 128),
             startTimestamp: timestamp,
             largeImageKey: "rhythmbox",
             largeImageText: largeImgText,
             smallImageKey: "play",
             smallImageText: "Playing",
             instance: true,
           });
         }
       });
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
    var meta = data.find(function(element) {
      return element.toString().startsWith("Metadata,[object Object],");
    });
    var status;
    service.getInterface(objectPath, interfaceName, (err, iface) => {
      iface.PlaybackStatus((err, str) => {
        if (!meta) {

          console.log("DEBUG: data is: " + data.toString());
            if (!data.toString().includes("PlaybackStatus,[object Object],") && str === "Stopped") {
              console.log("WE ARE STOPPED (Before checking playbackstats)");
              client.updatePresence({
                state: "By TopKek - https://github.com/ToppleKek/rhythmbox-discord",
                details: "Rhythmbox RPC",
                largeImageKey: "rhythmbox",
                smallImageKey: "stop",
                smallImageText: "Stopped",
                instance: true,
              });  
            }
            if (data.toString().includes("PlaybackStatus,[object Object],")) {
              console.log("Change, but metadata was not updated");
              console.log(str);
              switch (str) {
                case "Playing":
                  console.log("WE ARE PLAYING");
                  client.updatePresence({
                    state: savedAlbum,
                    details: savedDetails,
                    startTimestamp: timestamp,
                    largeImageKey: "rhythmbox",
                    largeImageText: savedLargeImgText,
                    smallImageKey: "play",
                    smallImageText: "Playing",
                    instance: true,
                  });    
                  break;            
                case "Paused":
                  console.log("WE ARE PAUSED");
                  client.updatePresence({
                    state: savedAlbum,
                    details: savedDetails,
                    startTimestamp: timestamp,
                    largeImageKey: "rhythmbox",
                    largeImageText: savedLargeImgText,
                    smallImageKey: "pause",
                    smallImageText: "Paused",
                    instance: true,
                  });    
                  break;
                case "Stopped":
                  console.log("WE ARE STOPPED");
                  client.updatePresence({
                    state: "By TopKek - https://github.com/ToppleKek/rhythmbox-discord",
                    details: "Rhythmbox RPC",
                    largeImageKey: "rhythmbox",
                    smallImageKey: "stop",
                    smallImageText: "Stopped",
                    instance: true,
                  });    
                  break;
              }
            }
            else {
              console.log("Change, but playbackstatus was not updated");
            }
        }
        else {
          service.getInterface(objectPath, playlistIfaceName, (err, iface) => {
            iface.ActivePlaylist((err, playStr) => {
              if (playStr) {
                var largeImgText = "Playlist: " + playStr[1].toString().split(",")[1];
                savedLargeImgText = largeImgText;
                console.log(playStr[1].toString().split(",")[1]);
              }
              else {
               console.log("No playlist");        
              }
              var metaStr = meta[1].toString();
              console.log("---META---\n" + meta[1] + "\n---END META---");
              title = metaStr.substring(metaStr.indexOf(",xesam:title,[object Object],") + 29, metaStr.indexOf(",xesam:artist,"));
              console.log("title: " + title);
              artist = metaStr.substring(metaStr.indexOf(",xesam:artist,[object Object],") + 30, metaStr.indexOf(",xesam:album,"));
              console.log("artist: " + artist);
              album = metaStr.substring(metaStr.indexOf(",xesam:album,[object Object],") + 29, metaStr.indexOf(",xesam:genre,"));
              console.log("album: " + album);
              var details = title.substring(0, 128) + " - " + artist.substring(0, 128);
              if (!title || !artist || !album) {
                console.log("Change, but title and artist was not changed.");
              }
              else {
                if (str !== "Stopped") {
                  savedDetails = details.substring(0, 128);
                  savedAlbum = album.substring(0, 128);
                  client.updatePresence({
                    state: album.substring(0, 128),
                    details: details.substring(0, 128),
                    startTimestamp: timestamp,
                    largeImageKey: "rhythmbox",
                    largeImageText: largeImgText,
                    smallImageKey: "play",
                    smallImageText: "Playing",
                    instance: true,
                  });
                }      
              }
            });
          });
        }
      });  
    });
  });
});

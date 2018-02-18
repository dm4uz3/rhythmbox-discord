require 'discordrb'
require 'yaml'
require 'dbus'

bus = DBus::SessionBus.instance
CONFIG = OpenStruct.new YAML.load_file 'config.yaml'
bot = Discordrb::Commands::CommandBot.new token: CONFIG.token, client_id: CONFIG.client_id, prefix: CONFIG.prefix, type: :user

rb_service = bus.service("org.mpris.MediaPlayer2.rhythmbox")
rb_player = rb_service.object("/org/mpris/MediaPlayer2")
rb_player.introspect
rb_player.default_iface = "org.mpris.MediaPlayer2.Player"

metadata = rb_player.Get('org.mpris.MediaPlayer2.Player', 'Metadata')
title = metadata[0]['xesam:title']

bot.ready do |event|
    puts "Playing #{title} - #{metadata[0]['xesam:artist'].join(', ')}"
    bot.game = "#{title} - #{metadata[0]['xesam:artist'].join(', ')}"
end

update = Thread.new do
  match = DBus::MatchRule.new
  match.type = "signal"
  match.interface = "org.freedesktop.DBus.Properties"
  match.path = "/org/mpris/MediaPlayer2"

  bus.add_match(match) do |msg, misc|
    # Heck you im too lazy to make this a case
    if msg.params[1]['PlaybackStatus'] == 'Paused' then bot.game = "PAUSED: #{title} - #{metadata[0]['xesam:artist'].join(', ')}" end
    if msg.params[1]['PlaybackStatus'] == 'Stopped' then bot.game = "Playback STOPPED. Rhythmbox" end
    next if msg.params[1].length == 1
    puts "#{msg.member}  #{msg.params[1]}"
    metadata = rb_player.Get('org.mpris.MediaPlayer2.Player', 'Metadata')
    title = metadata[0]['xesam:title']
    bot.game = "#{title} - #{metadata[0]['xesam:artist'].join(', ')}"
  end

  main = DBus::Main.new
  main << bus
  main.run

end

bot.run


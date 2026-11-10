#!/usr/bin/env bash
# Downloads the images, audio and fonts from the old Framer site into assets/.
set -euo pipefail
cd "$(dirname "$0")/.."
F=https://framerusercontent.com
get() { mkdir -p "$(dirname "$1")"; curl -fsSL -o "$1" "$2"; echo "ok $1"; }
get assets/fonts/tt-firs-neue-regular.woff2 $F/assets/pQGBYtxh10ym9baOfciSAawJ8tA.woff2
get assets/fonts/tt-firs-neue-demibold.woff2 $F/assets/jzl3be580mM2fEgw8YmcIoFM1F8.woff2
get assets/img/favicon-light.png $F/images/Bqaei1XrjSc3JXoNv7WOe5SdyIU.png
get assets/img/favicon-dark.png  $F/images/6olkKpf8HDviSxSCR0wPen2xCok.png
get assets/img/bio.jpg $F/images/f47hW58ZOg5K0BEuK9EpS75FWzI.jpg
get assets/media/demo.wav $F/assets/ts8oRUW5z66HTEfq5ENkJFU29sk.wav
get assets/media/iran-conference.mp4 $F/assets/SmcnRU5IojtW3D0KagLG7emfGsU.mp4
V=assets/img/voice
get $V/leon-kennedy.jpg          $F/images/7jOOmNvymUniBs7lxKuaO7j5A.jpg
get $V/jon-snow.jpg              $F/images/jA2gB3qdvU8rsdXI68fDe4x4ag.jpg
get $V/theon-greyjoy.jpg         $F/images/nGgS2qYSHJJZO87CSZiT67XAybQ.jpeg
get $V/dl-tanus.jpg              $F/images/NLkWTGsBpelRRmrB5XID04ZgaQ.jpg
get $V/teddy-flud.jpg            $F/images/45XfzWZNWgGzbTWMQO5KsxmSgNU.jpeg
get $V/igor-straussman.jpg       $F/images/sUIuOc4j4KLl8pYPX5uc4E44.jpg
get $V/pi-patel.jpg              $F/images/mAfot1ZL909BzCpCZ5Y6F4BuUE.jpg
get $V/jimmy-tree.jpg            $F/images/F9OibrjPaSTdQqL79pfAubIrT5o.jpg
get $V/louis.jpg                 $F/images/aCxkx4V9BKGj6qMqo4KPszetHHs.jpg
get $V/lawrence-durrell.jpg      $F/images/0X26xCp5qCe4d8zqTguGZxE58.jpg
get $V/willow.jpg                $F/images/3lyPAYUIkXsfhUCl15B992ULAQ4.jpg
get $V/steve-oconnor-despres.jpg $F/images/X8C4hoRcHE2RnL86Tq5Qbg50c.jpg
# Production background videos (originals are HEVC; convert to H.264 with ffmpeg afterwards)
get assets/media/sasha-why.mp4                 $F/assets/BH34loMgi7pedmg0VsB53Ue7CSs.mp4
get assets/media/bumerit.mp4                   $F/assets/21GK4plVFbRx2B6aL7BLK00wnQ0.mp4
get assets/media/maria-stuart.mp4              $F/assets/Z2BFzAEzphUCHTEqZBsPCHjkM.mp4
get assets/media/billy-milligan.mp4            $F/assets/daEIPJ3tHlDoqWYyWtoMANZ8I.mp4
get assets/media/the-charlie-gordon-effect.mp4 $F/assets/oPISPmex5KBKIhnLattZOrMKsU8.mp4

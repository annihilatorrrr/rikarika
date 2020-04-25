#!/bin/bash

if [[ -f $1 ]] ; then
  
  codec=$(mediainfo "--Inform=Audio;%CodecID%" "$1")
  if [ "$codec" != "40" ] ; then
    echo "$1"
    echo "Wrong Audio Codec $codec"
  fi
  
  codec=$(mediainfo "--Inform=Video;%Format_Profile%" "$1")
  ff=$(mediainfo "--Inform=Video;%Duration_FirstFrame%" "$1")
  if [ ! $(echo "$codec" | grep -P "^(High|Main|Baseline)@L[1-5](\.[1-3])*$" ) ] || [ "$ff" ] && [ "$ff" != "0" ]; then
    echo "$1"
    if [ "$ff" ]; then
      echo "Wrong Duration_FirstFrame $ff"
    fi
    echo "Wrong Video Codec $codec"
  fi

elif [[ -d $1 ]] ; then
  find "$1" -type f -name "*.mp4" -exec $0 "{}" \;
else
  path=/mnt/data/anime_new
  find -L "${path}" -type d -empty -printf 'Empty folder: %p\n'
  find -L "${path}" -not -name "*.mp4" -not -name "*.ass" -not -name "*.txt" -not -type d -printf 'Wrong file type: %p\n'
  find -L "${path}" -mindepth 1 -maxdepth 2 -type f -printf 'Should not put files here: %p\n'
  find -L "${path}" -mindepth 3 -type d -printf 'Should not put folders here: %p\n'
fi

# find -L "${path}" -type f -name "*.mp4" -exec bash -c 'echo "{}" ; codec=$(mediainfo "--Inform=Audio;%CodecID%" "{}") ; if [ "$codec" -ne "40" ] ; then echo "{}" ; fi' \;

# find -L "${path}" -type f -name "*.mp4" -exec bash -c 'codec=`mediainfo "--Inform=Video;%Format_Profile%" "{}"` ; if [ `echo "$codec" | grep "High\|Main\|Baseline"` ] ; then echo "$codec" ; else echo "{}" ; fi' \;


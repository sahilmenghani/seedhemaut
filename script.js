// ================================================================
// LIVE TIME
// ================================================================

function updateTime() {
  const timeElement = document.getElementById("currentTime");

  if (!timeElement) return;

  const now = new Date();

  timeElement.textContent = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Update immediately
updateTime();

// Update every second
setInterval(updateTime, 1000);
      const PLAYLIST_ID = "PL6Z5nmGOBNaB5M2YKMaVfMlrzwqGVZecK";

      let player;
      let playerReady = false;
      let audioUnlocked = false;
      let progressInterval = null;
      let currentVideoId = null;

      // Load YouTube IFrame API
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);

    // ================================================================
// ALBUMS / PLAYLISTS
// ================================================================
   function onYouTubeIframeAPIReady() {

  player = new YT.Player("yt-player", {

    height: "1",
    width: "1",

    playerVars: {
      listType: "playlist",
      list: ALBUMS[currentAlbumIndex].playlistId,
      autoplay: 1,
      mute: 1,
      controls: 0,
      playsinline: 1
    },

    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange
    }

  });

}
function switchAlbum(index) {

  if (!player || !player.loadPlaylist) return;

  if (index < 0 || index >= ALBUMS.length) return;

  currentAlbumIndex = index;

  const album = ALBUMS[currentAlbumIndex];

  player.loadPlaylist({
    list: album.playlistId,
    listType: "playlist",
    index: 0,
    startSeconds: 0
  });

  console.log("Now playing album:", album.name);
}
        const ALBUMS = [
  {
    name: "Lunch Break",
    playlistId: PLAYLIST_ID
  },
  {
    name: "Nayaab",
    playlistId: "PLVhh-pNjr3-A"
  },
  {
    name: "Bayaan",
    playlistId: "PLkEICesI2qi4XQwD9IxUNXzRgmMnJ_ucE"
  },
  {
    name: "न",
    playlistId: "PLaT0GyWvzyqijYNsKTo9mna6Txzt8qovn"
  },
  {
    name: "Shakti",
    playlistId: "OLAK5uy_lsIzlLpNhudxplsDw5YPUrXX0chzHpNwM"
  },
  {
    name: "Kshama",
    playlistId: "OLAK5uy_kjAh3eyV9-Lv73su7nsQ1zfxwx--IShVg"
  },
  {
    name: "DL91",
    playlistId: "OLAK5uy_kWDW8_A90JNXKEUgynxrBuLGh6I4Z1F0w"
  },
  {
    name: "EE",
    playlistId: "PL2WhG2MTtzX6mI0Za_pL8nYAhEzinkkwT"
  },
  {
    name: "Penthouse Tapes",
    playlistId: "PLdxwh8I3IjCCa-VW3QBnQ5T-GsD2iFkUb"
  },
  {
    name: "Features",
    playlistId: "PLkEICesI2qi4XQwD9IxUNXzRgmMnJ_ucE"
  }
];

let currentAlbumIndex = 0;
      

window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;


// ================================================================
// SWITCH ALBUM
// ================================================================

      
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

      function onPlayerReady(event) {
        playerReady = true;
        event.target.mute();
        event.target.playVideo();
        updateNowPlayingInfo();
        startProgressLoop();
      }

      function onPlayerStateChange(event) {
        const state = event.data;
        if (state === YT.PlayerState.PLAYING) {
          setPlayingUI(true);
          updateNowPlayingInfo();
        } else if (state === YT.PlayerState.PAUSED) {
          setPlayingUI(false);
        } else if (state === YT.PlayerState.ENDED) {
          player.nextVideo();
        } else if (state === YT.PlayerState.CUED) {
          updateNowPlayingInfo();
        }
      }

      function setPlayingUI(isPlaying) {
        const playIcon = document.getElementById("playIcon");
        const disc = document.getElementById("vinylDisc");
        if (isPlaying) {
          playIcon.innerHTML =
            '<rect x="6" y="5" width="4" height="14"></rect><rect x="14" y="5" width="4" height="14"></rect>';
          disc.classList.add("spinning");
        } else {
          playIcon.innerHTML = '<path d="M8 5v14l11-7z"></path>';
          disc.classList.remove("spinning");
        }
      }

      function updateNowPlayingInfo() {
        if (!playerReady) return;
        try {
          const data = player.getVideoData();
          if (data && data.video_id) {
            currentVideoId = data.video_id;
            document.getElementById("trackTitle").textContent =
              data.title || "Loading…";
            document.getElementById("albumArt").src =
              `https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`;
          }
        } catch (e) {}
      }

      function formatTime(sec) {
        if (!sec || isNaN(sec)) return "0:00";
        sec = Math.floor(sec);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
      }

      function startProgressLoop() {
        if (progressInterval) clearInterval(progressInterval);
        progressInterval = setInterval(() => {
          if (!playerReady) return;
          try {
            const dur = player.getDuration();
            const cur = player.getCurrentTime();
            if (dur > 0) {
              const pct = (cur / dur) * 100;
              document.getElementById("progressFill").style.width = pct + "%";
            }
            document.getElementById("timeDisplay").textContent =
              `${formatTime(cur)} / ${formatTime(dur)}`;
            // catch title updates in case metadata loads late
            const data = player.getVideoData();
            if (data && data.video_id && data.video_id !== currentVideoId) {
              updateNowPlayingInfo();
            } else if (
              data &&
              data.title &&
              document.getElementById("trackTitle").textContent === "Loading…"
            ) {
              updateNowPlayingInfo();
            }
          } catch (e) {}
        }, 500);
      }

      // Controls
      document.getElementById("playBtn").addEventListener("click", () => {
        if (!playerReady) return;
        const state = player.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      });

      document.getElementById("prevBtn").addEventListener("click", () => {
        if (!playerReady) return;
        player.previousVideo();
      });

      document.getElementById("nextBtn").addEventListener("click", () => {
        if (!playerReady) return;
        player.nextVideo();
      });

      document.getElementById("progressBar").addEventListener("click", (e) => {
        if (!playerReady) return;
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        const dur = player.getDuration();
        if (dur > 0) {
          player.seekTo(dur * pct, true);
        }
      });

      document.getElementById("shuffleBtn").addEventListener("click", (e) => {
        if (!playerReady) return;
        const btn = e.currentTarget;
        btn.classList.add("flash");
        setTimeout(() => btn.classList.remove("flash"), 250);

        try {
          const playlist = player.getPlaylist();
          if (playlist && playlist.length > 1) {
            const currentIndex = player.getPlaylistIndex();
            let randomIndex;
            do {
              randomIndex = Math.floor(Math.random() * playlist.length);
            } while (randomIndex === currentIndex);
            player.playVideoAt(randomIndex);
          } else {
            player.nextVideo();
          }
        } catch (err) {
          player.nextVideo();
        }
      });

      // Unlock audio on first interaction anywhere on the page
      function unlockAudio() {
        if (audioUnlocked || !playerReady) return;
        audioUnlocked = true;
        player.unMute();
        player.setVolume(100);
        document.removeEventListener("click", unlockAudio);
        document.removeEventListener("touchstart", unlockAudio);
      }
      document.addEventListener("click", unlockAudio);
      document.addEventListener("touchstart", unlockAudio);

      // ================================================================
      // WALLPAPERS — ADD YOUR OWN IMAGES / GIFS HERE
      // ================================================================
      // How to add a wallpaper:
      // 1. Go to a free "image to base64" converter website, for example:
      //    https://www.base64-image.de/  (works for images AND gifs)
      // 2. Upload your picture or gif there. It will give you a long block
      //    of text starting with something like:
      //       data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD......
      //    or for a gif:
      //       data:image/gif;base64,R0lGODlhAQABAIAAAP.......
      // 3. Copy that ENTIRE text (it can be very long, that's normal).
      // 4. Paste it as a new line inside the WALLPAPERS list below,
      //    with a comma at the end, wrapped in quotes, like this:
      //
      //    const WALLPAPERS = [
      //      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD......",   <-- existing background
      //      "data:image/jpeg;base64,PASTE_YOUR_NEW_ONE_HERE......",      <-- your new wallpaper
      //      "data:image/gif;base64,PASTE_A_GIF_HERE......",              <-- a gif works too
      //    ];
      //
      // 5. Save the file and re-upload it to Netlify (or drag a fresh
      //    index.html onto app.netlify.com/drop again) to go live.
      //
      // The very first item in the list is what shows when the page loads.
      // Every time someone clicks the picture-frame button, it moves to
      // the next item in the list, and loops back to the first after the
      // last one.
      // ================================================================
      const WALLPAPERS = [
        {
          type: "image",
          src: "/1.png",
        },
        {
          type: "image",
          src: "/2.jpg",
        },
        {
          type: "image",
          src: "/3.jpg",
        },
        {
          type: "image",
          src: "/4.jpg",
        },
        {
          type: "image",
          src: "/seedhemaut.jpg",
        },
        // Example video wallpaper
        {
          type: "video",
          src: "/nalla freestyle.mp4",
        },
      ];

      let wallpaperIndex = 0;
      const wallpaperBtn = document.getElementById("wallpaperBtn");
      const wallpaperVideo = document.getElementById("wallpaperVideo");

      function changeWallpaper() {
        wallpaperIndex++;

        // Go back to first wallpaper after the last one
        if (wallpaperIndex >= WALLPAPERS.length) {
          wallpaperIndex = 0;
        }

        const wallpaper = WALLPAPERS[wallpaperIndex];

        // Image wallpaper
        if (wallpaper.type === "image") {
          wallpaperVideo.pause();
          wallpaperVideo.style.display = "none";

          document.body.style.backgroundImage = `url("${wallpaper.src}")`;

          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundRepeat = "no-repeat";
          document.body.style.backgroundAttachment = "fixed";
        }

        // Video wallpaper
        else if (wallpaper.type === "video") {
          document.body.style.backgroundImage = "none";

          wallpaperVideo.src = wallpaper.src;
          wallpaperVideo.style.display = "block";

          wallpaperVideo.currentTime = 0;
          wallpaperVideo.play().catch(() => {});
        }
      }

      wallpaperBtn.addEventListener("click", (e) => {
        const btn = e.currentTarget;

        btn.classList.add("flash");

        setTimeout(() => {
          btn.classList.remove("flash");
        }, 250);

        changeWallpaper();
      });

      // ================================================================
      // TBSM AUDIO — ADD YOUR AUDIO FILE HERE (once you have it)
      // ================================================================
      // How to add the audio:
      // 1. Go to a free "audio to base64" converter website, for example:
      //    https://base64.guru/converter/encode/audio
      // 2. Upload your mp3 file there. It will give you a long block of
      //    text starting with something like:
      //       data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAAA......
      // 3. Copy that ENTIRE text.
      // 4. Paste it below, replacing the empty quotes "" , like this:
      //
      //    const TBSM_AUDIO_SRC = "data:audio/mpeg;base64,SUQzBAAAAAAA......";
      //
      // 5. Save and re-upload to Netlify to go live. The button will then
      //    play your audio each time it's clicked (and pause if clicked
      //    again while playing).
      // ================================================================
      const TBSM_AUDIO_SRC = "/nalla freestyle.mp4"; // 👈 paste your base64 audio here, inside the quotes

      const tbsmAudioEl = document.getElementById("tbsmAudio");
      if (TBSM_AUDIO_SRC) {
        tbsmAudioEl.src = TBSM_AUDIO_SRC;
      }

      document.getElementById("tbsmAudioBtn").addEventListener("click", (e) => {
        const btn = e.currentTarget;
        btn.classList.add("flash");
        setTimeout(() => btn.classList.remove("flash"), 250);

        if (!TBSM_AUDIO_SRC) {
          console.log(
            "No TBSM audio added yet — see the TBSM_AUDIO_SRC instructions in the code.",
          );
          return;
        }
        if (tbsmAudioEl.paused) {
          tbsmAudioEl.currentTime = 0;
          tbsmAudioEl.play();
        } else {
          tbsmAudioEl.pause();
        }
      });
    
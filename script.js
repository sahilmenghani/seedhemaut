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

  if (!playerReady || !player) {
    console.log("Player not ready");
    return;
  }

  const album = ALBUMS[index];

  if (!album) {
    console.log("Invalid album:", index);
    return;
  }

  currentAlbumIndex = index;

  console.log("Switching to:", album.name);

  player.loadPlaylist({
    listType: "playlist",
    list: album.playlistId,
    index: 0,
    startSeconds: 0
  });
}
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;


// ================================================================
// SWITCH ALBUM
// ================================================================

      function onPlayerReady(event) {
        playerReady = true;
        event.target.mute();
        event.target.playVideo();
        updateNowPlayingInfo();
        startProgressLoop();
      }
function onPlayerStateChange(event) {

  const state = event.data;

  // ================================================================
  // PLAYING
  // ================================================================
  if (state === YT.PlayerState.PLAYING) {

    setPlayingUI(true);
    updateNowPlayingInfo();

  }

  // ================================================================
  // PAUSED
  // ================================================================
  else if (state === YT.PlayerState.PAUSED) {

    setPlayingUI(false);

  }

  // ================================================================
  // ENDED
  // ================================================================
  else if (state === YT.PlayerState.ENDED) {

    if (!playerReady || !player) return;

    try {

      const playlist = player.getPlaylist();
      const currentIndex = player.getPlaylistIndex();

      console.log(
        "Song ended:",
        currentIndex + 1,
        "/",
        playlist ? playlist.length : "unknown"
      );

      // ============================================================
      // LAST SONG OF CURRENT ALBUM
      // ============================================================
      if (
        playlist &&
        playlist.length > 0 &&
        currentIndex === playlist.length - 1
      ) {

        const nextAlbumIndex =
          (currentAlbumIndex + 1) % ALBUMS.length;

        console.log(
          "Current album finished:",
          ALBUMS[currentAlbumIndex].name
        );

        console.log(
          "Switching to next album:",
          ALBUMS[nextAlbumIndex].name
        );

        currentAlbumIndex = nextAlbumIndex;

        player.loadPlaylist({
          listType: "playlist",
          list: ALBUMS[nextAlbumIndex].playlistId,
          index: 0,
          startSeconds: 0
        });

      }

      // ============================================================
      // NORMAL NEXT SONG
      // ============================================================
      else {

        player.nextVideo();

      }

    } catch (error) {

      console.error("Album switch error:", error);

    }

  }

  // ================================================================
  // CUED
  // ================================================================
  else if (state === YT.PlayerState.CUED) {

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
// ================================================================
// MUSIC LIBRARY — LOAD ALL SONG DETAILS
// ================================================================

// Cache titles/artists we've already fetched so revisiting an album
// (or the currently playing album) shows titles instantly instead of
// re-hitting the network and flashing "Loading..." again.
const videoInfoCache = new Map();

async function getYouTubeVideoInfo(videoId) {
  if (videoInfoCache.has(videoId)) {
    return videoInfoCache.get(videoId);
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch video information");
    }

    const data = await response.json();

    const info = {
      title: data.title || "Unknown Song",
      artist: data.author_name || "Seedhe Maut",
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    };

    videoInfoCache.set(videoId, info);

    return info;

  } catch (error) {

    console.error("Could not load video info:", videoId, error);

    return {
      title: "Unknown Song",
      artist: "Seedhe Maut",
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    };
  }
}


// ================================================================
// RENDER LIBRARY SONGS
// ================================================================



// ================================================================
// HIGHLIGHT CURRENT SONG
// ================================================================

function updateLibraryActiveSong(index) {

  const songs = document.querySelectorAll(".library-song");

  songs.forEach((song, i) => {

    song.classList.toggle("active", i === index);

  });
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
    // ================================================================
// MUSIC LIBRARY
// ================================================================

const libraryBtn = document.getElementById("libraryBtn");
const libraryClose = document.getElementById("libraryClose");
const libraryOverlay = document.getElementById("libraryOverlay");
const musicLibrary = document.getElementById("musicLibrary");

function openLibrary() {
  musicLibrary.classList.add("open");
  libraryOverlay.classList.add("open");

  // Load album list when opening
  renderAlbums();
}

function closeLibrary() {
  musicLibrary.classList.remove("open");
  libraryOverlay.classList.remove("open");
}

libraryBtn.addEventListener("click", openLibrary);
libraryClose.addEventListener("click", closeLibrary);
libraryOverlay.addEventListener("click", closeLibrary);

// ESC key closes library
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeLibrary();
  }
});


// ================================================================
// RENDER ALBUMS
// ================================================================

function renderAlbums() {
  const albumList = document.getElementById("albumList");

  if (!albumList) return;

  albumList.innerHTML = "";

  ALBUMS.forEach((album, index) => {
    const albumItem = document.createElement("div");

    albumItem.className =
      "album-item" +
      (index === currentAlbumIndex ? " active" : "");

    albumItem.innerHTML = `
      <span class="album-number">
        ${String(index + 1).padStart(2, "0")}
      </span>

      <span class="album-name">
        ${album.name}
      </span>
    `;

    albumItem.addEventListener("click", () => {
      selectLibraryAlbum(index);
    });

    albumList.appendChild(albumItem);
  });

  // Show current album
  renderLibrarySongs(currentAlbumIndex);
}


// ================================================================
// SELECT ALBUM FROM LIBRARY
// ================================================================
// ================================================================
// SELECT ALBUM FROM LIBRARY
// ================================================================

async function selectLibraryAlbum(index) {

  const album = ALBUMS[index];

  if (!album) return;

  currentAlbumIndex = index;

  // Update active album immediately
  document.querySelectorAll(".album-item").forEach((item, i) => {

    item.classList.toggle("active", i === index);

  });

  // Update album title immediately
  const albumName =
    document.getElementById("libraryAlbumName");

  if (albumName) {
    albumName.textContent = album.name;
  }

  // Show loading immediately
  const songList =
    document.getElementById("librarySongList");

  if (songList) {
    songList.innerHTML = `
      <div class="library-empty">
        Loading songs...
      </div>
    `;
  }

  // Snapshot the CURRENT playlist before switching. YouTube doesn't
  // clear player.getPlaylist() the instant loadPlaylist() is called —
  // it keeps returning the old album's video IDs for a bit. Without
  // this snapshot, the code below can mistake "still the old playlist"
  // for "the new one has loaded", which is why you used to have to
  // click an album more than once.
  let previousPlaylist = [];
  try {
    previousPlaylist =
      playerReady && player ? (player.getPlaylist() || []) : [];
  } catch (e) {}

  // Change YouTube playlist
  switchAlbum(index);

  // Wait for the NEW playlist and render it
  await renderLibrarySongs(index, previousPlaylist);
}

// ================================================================
// RENDER SONGS IN MUSIC LIBRARY
// ================================================================

// Bumped every time a new album is selected, so an in-flight render
// from a previous (now stale) click can detect it's outdated and
// stop touching the DOM instead of overwriting the current album.
let libraryRequestId = 0;

async function renderLibrarySongs(index, previousPlaylist = []) {

  const requestId = ++libraryRequestId;

  const songList = document.getElementById("librarySongList");
  const albumName = document.getElementById("libraryAlbumName");

  if (!songList) return;

  const album = ALBUMS[index];

  if (!album) {
    songList.innerHTML =
      '<div class="library-empty">Select an album</div>';
    return;
  }

  if (albumName) {
    albumName.textContent = album.name;
  }

  // Show loading while YouTube changes playlist
  songList.innerHTML = `
    <div class="library-empty">
      Loading songs...
    </div>
  `;

  // ================================================================
  // WAIT FOR YOUTUBE PLAYLIST TO ACTUALLY LOAD
  // ================================================================
  // We don't just wait for "some playlist" — we wait for a playlist
  // that's DIFFERENT from the one we had before switching albums.
  // (On the very first load there's nothing to compare against, so
  // any non-empty playlist is accepted right away.)

  const previousKey = previousPlaylist.join(",");

  let playlist = [];
  let attempts = 0;

  while (attempts < 60) {

    if (requestId !== libraryRequestId) return; // a newer album was picked
    if (!playerReady || !player) return;

    try {
      const current = player.getPlaylist() || [];
      const currentKey = current.join(",");

      if (current.length > 0 && (previousKey === "" || currentKey !== previousKey)) {
        playlist = current;
        break;
      }

    } catch (error) {
      console.log("Waiting for playlist...");
    }

    await new Promise(resolve => setTimeout(resolve, 150));

    attempts++;
  }

  if (requestId !== libraryRequestId) return; // stale by the time we finished waiting

  // ================================================================
  // NO PLAYLIST
  // ================================================================

  if (!playlist.length) {

    songList.innerHTML = `
      <div class="library-empty">
        No songs found
      </div>
    `;

    return;
  }

  // ================================================================
  // CREATE ALL SONG ROWS
  // ================================================================

  songList.innerHTML = "";

  playlist.forEach((videoId, songIndex) => {

    const song = document.createElement("div");

    song.className = "library-song";

    song.innerHTML = `
      <div class="library-song-number">
        ${String(songIndex + 1).padStart(2, "0")}
      </div>

      <div class="library-cover">
        <img
          src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg"
          alt=""
        >
      </div>

      <div class="library-song-info">

        <div class="library-song-title">
          Loading...
        </div>

        <div class="library-song-artist">
          Seedhe Maut
        </div>

      </div>
    `;

    // ================================================================
    // CLICK SONG
    // ================================================================

    song.addEventListener("click", () => {

      if (!playerReady || !player) return;

      player.playVideoAt(songIndex);

      updateLibraryActiveSong(songIndex);

      updateNowPlayingInfo();

      closeLibrary();

    });

    songList.appendChild(song);

    // ================================================================
    // GET TITLE FOR EVERY SONG
    // ================================================================

    getYouTubeVideoInfo(videoId).then(info => {

      // Ignore results from an album the user has already navigated away from
      if (requestId !== libraryRequestId) return;

      const titleElement =
        song.querySelector(".library-song-title");

      const artistElement =
        song.querySelector(".library-song-artist");

      if (titleElement) {
        titleElement.textContent = info.title;
      }

      if (artistElement) {
        artistElement.textContent = info.artist;
      }

    });

  });

  // ================================================================
  // HIGHLIGHT CURRENT SONG
  // ================================================================

  try {

    const currentIndex = player.getPlaylistIndex();

    updateLibraryActiveSong(currentIndex);

  } catch (error) {

    console.log("Could not get current playlist index");

  }

}
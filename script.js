let player;

let playerReady = false;

let backgroundPlayer = null;
let backgroundPlayerReady = false;

let backgroundVideoId = null;
let backgroundSyncInterval = null;
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

updateTime();
setInterval(updateTime, 1000);


// ================================================================
// ALBUMS
// ================================================================

const PLAYLIST_ID = "PL6Z5nmGOBNaB5M2YKMaVfMlrzwqGVZecK";

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


// ================================================================
// PLAYER STATE
// ================================================================

let player = null;
let playerReady = false;
let audioUnlocked = false;

let progressInterval = null;

// Album currently playing
let currentAlbumIndex = 0;

// Album currently being browsed in library
let browsingAlbumIndex = 0;

// Exact video currently playing
let currentVideoId = null;

// Complete playlist of currently playing album
let currentPlaylist = [];

// Current song index
let currentSongIndex = 0;

// Cached playlists
const playlistCache = new Map();

// Cached video information
const videoInfoCache = new Map();

// Prevent old library requests overwriting new requests
let libraryRequestId = 0;

// Used when loading playlists into main player
let playlistLoadRequestId = 0;


// ================================================================
// LOAD YOUTUBE IFRAME API
// ================================================================

const youtubeScript = document.createElement("script");

youtubeScript.src =
  "https://www.youtube.com/iframe_api";

document.head.appendChild(youtubeScript);


// ================================================================
// CREATE YOUTUBE PLAYER
// ================================================================

function onYouTubeIframeAPIReady() {

  // ================================================================
  // MAIN AUDIO PLAYER
  // ================================================================

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


  // ================================================================
  // BACKGROUND MUSIC VIDEO PLAYER
  // ALWAYS MUTED
  // ================================================================

  backgroundPlayer = new YT.Player(
    "musicVideoPlayer",
    {

      width: "1920",
      height: "1080",

      playerVars: {

        autoplay: 0,

        mute: 1,

        controls: 0,

        playsinline: 1,

        rel: 0,

        modestbranding: 1,

        fs: 0

      },

      events: {

        onReady: function(event) {

          backgroundPlayerReady = true;

          event.target.mute();

          event.target.setVolume(0);

        }

      }

    }
  );

}
window.onYouTubeIframeAPIReady =
  onYouTubeIframeAPIReady;


// ================================================================
// PLAYER READY
// ================================================================

function onPlayerReady(event) {

  playerReady = true;

  event.target.mute();

  // Get initial playlist
  waitForPlaylist(
    ALBUMS[currentAlbumIndex].playlistId,
    0
  );

  updateNowPlayingInfo();

  startProgressLoop();

}


// ================================================================
// PLAYER ERROR
// ================================================================

function onPlayerError(event) {

  console.error(
    "YouTube Player Error:",
    event.data
  );

}


// ================================================================
// PLAYER STATE CHANGE
// ================================================================
function onPlayerStateChange(event) {

  const state =
    event.data;


  // ================================================================
  // PLAYING
  // ================================================================

  if (
    state ===
    YT.PlayerState.PLAYING
  ) {

    setPlayingUI(true);

    updateNowPlayingInfo();


    // Play background video
    if (
      backgroundPlayerReady &&
      backgroundPlayer
    ) {

      try {

        backgroundPlayer.playVideo();

      } catch (e) {}

    }

    return;

  }


  // ================================================================
  // PAUSED
  // ================================================================

  if (
    state ===
    YT.PlayerState.PAUSED
  ) {

    setPlayingUI(false);


    // Pause background video
    if (
      backgroundPlayerReady &&
      backgroundPlayer
    ) {

      try {

        backgroundPlayer.pauseVideo();

      } catch (e) {}

    }

    return;

  }


  // ================================================================
  // ENDED
  // ================================================================

  if (
    state ===
    YT.PlayerState.ENDED
  ) {

    playNextSong();

    return;

  }


  // ================================================================
  // CUED
  // ================================================================

  if (
    state ===
    YT.PlayerState.CUED
  ) {

    updateNowPlayingInfo();

  }

}


// ================================================================
// WAIT FOR PLAYLIST
// ================================================================

function waitForPlaylist(
  playlistId,
  songIndex = 0
) {

  const requestId =
    ++playlistLoadRequestId;

  let attempts = 0;

  const maxAttempts = 20;


  const interval =
    setInterval(() => {

      attempts++;


      // Ignore old request
      if (
        requestId !==
        playlistLoadRequestId
      ) {

        clearInterval(interval);

        return;

      }


      try {

        const playlist =
          player.getPlaylist() || [];


        if (
          playlist.length > 0
        ) {

          clearInterval(interval);


          // Cache playlist
          playlistCache.set(
            playlistId,
            playlist
          );


          currentPlaylist =
            playlist;


          // Prevent invalid index
          if (
            songIndex >=
            playlist.length
          ) {

            songIndex = 0;

          }


          currentSongIndex =
            songIndex;


          // Play requested song
          playExactVideo(
            playlist[songIndex]
          );

        }


        else if (
          attempts >=
          maxAttempts
        ) {

          clearInterval(interval);

          console.error(
            "Could not load playlist:",
            playlistId
          );

        }

      }

      catch (error) {

        console.error(
          "Playlist loading error:",
          error
        );

      }

    }, 150);

}


// ================================================================
// LOAD ALBUM FOR PLAYBACK
// ================================================================

function loadAlbumForPlayback(
  albumIndex,
  songIndex = 0
) {

  if (
    !playerReady ||
    !player
  ) {

    return;

  }


  const album =
    ALBUMS[albumIndex];


  if (!album) {

    console.error(
      "Invalid album:",
      albumIndex
    );

    return;

  }


  currentAlbumIndex =
    albumIndex;


  const cachedPlaylist =
    playlistCache.get(
      album.playlistId
    );


  // ------------------------------------------------
  // PLAYLIST ALREADY CACHED
  // ------------------------------------------------

  if (
    cachedPlaylist &&
    cachedPlaylist.length > 0
  ) {

    currentPlaylist =
      cachedPlaylist;


    if (
      songIndex >=
      currentPlaylist.length
    ) {

      songIndex = 0;

    }


    currentSongIndex =
      songIndex;


    playExactVideo(
      currentPlaylist[
        currentSongIndex
      ]
    );

    return;

  }


  // ------------------------------------------------
  // LOAD PLAYLIST FROM YOUTUBE
  // ------------------------------------------------

  player.loadPlaylist({

    listType:
      "playlist",

    list:
      album.playlistId,

    index: 0,

    startSeconds: 0

  });


  waitForPlaylist(
    album.playlistId,
    songIndex
  );

}


// ================================================================
// PLAY EXACT VIDEO
// ================================================================

function playExactVideo(videoId) {

  if (
    !playerReady ||
    !player ||
    !videoId
  ) {

    return;

  }


  console.log(
    "Playing exact video:",
    videoId
  );


  currentVideoId =
    videoId;


  player.loadVideoById({

    videoId:
      videoId,

    startSeconds: 0

  });


  // ------------------------------------------------
  // UPDATE UI IMMEDIATELY
  // ------------------------------------------------

  const albumArt =
    document.getElementById(
      "albumArt"
    );


  if (albumArt) {

    albumArt.src =
      `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  }


  const trackTitle =
    document.getElementById(
      "trackTitle"
    );


  if (trackTitle) {

    trackTitle.textContent =
      "Loading…";

  }


  updateLibraryActiveSong(
    currentSongIndex
  );

}


// ================================================================
// PLAY NEXT SONG
// ================================================================

function playNextSong() {

  if (
    !currentPlaylist ||
    currentPlaylist.length === 0
  ) {

    return;

  }


  // ------------------------------------------------
  // NEXT SONG IN SAME ALBUM
  // ------------------------------------------------

  if (
    currentSongIndex <
    currentPlaylist.length - 1
  ) {

    currentSongIndex++;


    playExactVideo(
      currentPlaylist[
        currentSongIndex
      ]
    );


    return;

  }


  // ------------------------------------------------
  // CURRENT ALBUM FINISHED
  // ------------------------------------------------

  const nextAlbumIndex =
    (
      currentAlbumIndex + 1
    ) %
    ALBUMS.length;


  console.log(
    "Album finished:",
    ALBUMS[
      currentAlbumIndex
    ].name
  );


  console.log(
    "Starting next album:",
    ALBUMS[
      nextAlbumIndex
    ].name
  );


  loadAlbumForPlayback(
    nextAlbumIndex,
    0
  );

}


// ================================================================
// PLAY PREVIOUS SONG
// ================================================================

function playPreviousSong() {

  if (
    !currentPlaylist ||
    currentPlaylist.length === 0
  ) {

    return;

  }


  if (
    currentSongIndex > 0
  ) {

    currentSongIndex--;


    playExactVideo(
      currentPlaylist[
        currentSongIndex
      ]
    );

  }

}


// ================================================================
// SYNC CURRENT VIDEO WITH PLAYLIST
// ================================================================

function syncCurrentSongWithVideo() {

  if (
    !currentVideoId ||
    !currentPlaylist
  ) {

    return;

  }


  const index =
    currentPlaylist.indexOf(
      currentVideoId
    );


  if (
    index !== -1
  ) {

    currentSongIndex =
      index;

  }

}


// ================================================================
// UPDATE PLAYING UI
// ================================================================

function setPlayingUI(isPlaying) {

  const playIcon =
    document.getElementById(
      "playIcon"
    );


  const disc =
    document.getElementById(
      "vinylDisc"
    );


  if (
    !playIcon ||
    !disc
  ) {

    return;

  }


  if (isPlaying) {

    playIcon.innerHTML =
      `
      <rect
        x="6"
        y="5"
        width="4"
        height="14"
      ></rect>

      <rect
        x="14"
        y="5"
        width="4"
        height="14"
      ></rect>
      `;


    disc.classList.add(
      "spinning"
    );

  }


  else {

    playIcon.innerHTML =
      `
      <path
        d="M8 5v14l11-7z"
      ></path>
      `;


    disc.classList.remove(
      "spinning"
    );

  }

}

// ================================================================
// BACKGROUND MUSIC VIDEO
// ================================================================

function updateBackgroundVideo(videoId) {

  if (
    !backgroundPlayerReady ||
    !backgroundPlayer ||
    !videoId
  ) {
    return;
  }


  // ------------------------------------------------
  // Same video already loaded
  // ------------------------------------------------

  if (backgroundVideoId === videoId) {
    return;
  }


  backgroundVideoId = videoId;


  const background =
    document.getElementById(
      "musicVideoBackground"
    );


  // ------------------------------------------------
  // Show background
  // ------------------------------------------------

  if (background) {

    background.classList.add(
      "active"
    );

  }


  // ------------------------------------------------
  // Get current song time
  // ------------------------------------------------

  let currentTime = 0;

  try {

    currentTime =
      player.getCurrentTime() || 0;

  } catch (e) {}


  // ------------------------------------------------
  // Load SAME YouTube video
  // Background is always muted
  // ------------------------------------------------

  try {

    backgroundPlayer.loadVideoById({

      videoId: videoId,

      startSeconds: currentTime

    });

    backgroundPlayer.mute();

    backgroundPlayer.setVolume(0);

  } catch (error) {

    console.error(
      "Background video error:",
      error
    );

  }

}
// ================================================================
// UPDATE NOW PLAYING INFORMATION
// ================================================================
function updateNowPlayingInfo() {

  if (!playerReady || !player) {
    return;
  }

  try {

    const data =
      player.getVideoData();


    if (
      data &&
      data.video_id
    ) {

      const newVideoId =
        data.video_id;


      // ------------------------------------------------
      // Detect song change
      // ------------------------------------------------

      const songChanged =
        currentVideoId !== newVideoId;


      currentVideoId =
        newVideoId;


      // ------------------------------------------------
      // Update title
      // ------------------------------------------------

      const trackTitle =
        document.getElementById(
          "trackTitle"
        );

      if (trackTitle) {

        trackTitle.textContent =
          data.title || "Loading…";

      }


      // ------------------------------------------------
      // Update album art
      // ------------------------------------------------

      const albumArt =
        document.getElementById(
          "albumArt"
        );

      if (albumArt) {

        albumArt.src =
          `https://img.youtube.com/vi/${newVideoId}/mqdefault.jpg`;

      }


      // ------------------------------------------------
      // CHANGE BACKGROUND VIDEO
      // Only when song actually changes
      // ------------------------------------------------

      if (songChanged) {

        updateBackgroundVideo(
          newVideoId
        );

      }

    }

  } catch (error) {

    console.error(
      "Now playing update error:",
      error
    );

  }

}


// ================================================================
// FORMAT TIME
// ================================================================

function formatTime(seconds) {

  if (
    !seconds ||
    isNaN(seconds)
  ) {

    return "0:00";

  }


  seconds =
    Math.floor(seconds);


  const minutes =
    Math.floor(
      seconds / 60
    );


  const remainingSeconds =
    seconds % 60;


  return (
    minutes +
    ":" +
    remainingSeconds
      .toString()
      .padStart(2, "0")
  );

}


// ================================================================
// PROGRESS LOOP
// ================================================================

function startProgressLoop() {

  if (
    progressInterval
  ) {

    clearInterval(
      progressInterval
    );

  }


  progressInterval =
    setInterval(() => {

      if (
        !playerReady ||
        !player
      ) {

        return;

      }


      try {

        const duration =
          player.getDuration();


        const currentTime =
          player.getCurrentTime();


        const progressFill =
          document.getElementById(
            "progressFill"
          );


        const timeDisplay =
          document.getElementById(
            "timeDisplay"
          );


        if (
          duration > 0 &&
          progressFill
        ) {

          const percentage =
            (
              currentTime /
              duration
            ) *
            100;


          progressFill.style.width =
            percentage +
            "%";

        }


        if (timeDisplay) {

          timeDisplay.textContent =
            `${formatTime(
              currentTime
            )} / ${formatTime(
              duration
            )}`;

        }


        const data =
          player.getVideoData();


        if (
          data &&
          data.video_id &&
          data.video_id !==
          currentVideoId
        ) {

          updateNowPlayingInfo();

        }


        else if (
          data &&
          data.title
        ) {

          const trackTitle =
            document.getElementById(
              "trackTitle"
            );


          if (
            trackTitle &&
            trackTitle.textContent ===
            "Loading…"
          ) {

            updateNowPlayingInfo();

          }

        }

      }

      catch (error) {}

    }, 500);

}


// ================================================================
// GET YOUTUBE VIDEO INFORMATION
// ================================================================

async function getYouTubeVideoInfo(
  videoId
) {

  if (
    videoInfoCache.has(
      videoId
    )
  ) {

    return videoInfoCache.get(
      videoId
    );

  }


  try {

    const response =
      await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );


    if (
      !response.ok
    ) {

      throw new Error(
        "Could not fetch video information"
      );

    }


    const data =
      await response.json();


    const info = {

      title:
        data.title ||
        "Unknown Song",

      artist:
        data.author_name ||
        "Seedhe Maut",

      thumbnail:
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

    };


    videoInfoCache.set(
      videoId,
      info
    );


    return info;

  }

  catch (error) {

    console.error(
      "Could not load video information:",
      videoId
    );


    return {

      title:
        "Unknown Song",

      artist:
        "Seedhe Maut",

      thumbnail:
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`

    };

  }

}


// ================================================================
// MUSIC CONTROLS
// ================================================================

const playBtn =
  document.getElementById(
    "playBtn"
  );


if (playBtn) {

  playBtn.addEventListener(
    "click",
    () => {

      if (
        !playerReady
      ) {

        return;

      }


      const state =
        player.getPlayerState();


      if (
        state ===
        YT.PlayerState.PLAYING
      ) {

        player.pauseVideo();

      }

      else {

        player.playVideo();

      }

    }
  );

}


// ================================================================
// PREVIOUS BUTTON
// ================================================================

const prevBtn =
  document.getElementById(
    "prevBtn"
  );


if (prevBtn) {

  prevBtn.addEventListener(
    "click",
    () => {

      if (
        !playerReady
      ) {

        return;

      }


      playPreviousSong();

    }
  );

}


// ================================================================
// NEXT BUTTON
// ================================================================

const nextBtn =
  document.getElementById(
    "nextBtn"
  );


if (nextBtn) {

  nextBtn.addEventListener(
    "click",
    () => {

      if (
        !playerReady
      ) {

        return;

      }


      playNextSong();

    }
  );

}


// ================================================================
// PROGRESS BAR CLICK
// ================================================================

const progressBar =
  document.getElementById(
    "progressBar"
  );


if (progressBar) {

  progressBar.addEventListener(
    "click",
    (event) => {

      if (
        !playerReady
      ) {

        return;

      }


      const rect =
        progressBar.getBoundingClientRect();


      const percentage =
        (
          event.clientX -
          rect.left
        ) /
        rect.width;


      const duration =
        player.getDuration();


      if (
        duration > 0
      ) {

        player.seekTo(
          duration *
          percentage,
          true
        );

      }

    }
  );

}


// ================================================================
// SHUFFLE BUTTON
// ================================================================

const shuffleBtn =
  document.getElementById(
    "shuffleBtn"
  );


if (shuffleBtn) {

  shuffleBtn.addEventListener(
    "click",
    (event) => {

      if (
        !playerReady ||
        !currentPlaylist ||
        currentPlaylist.length < 2
      ) {

        return;

      }


      const button =
        event.currentTarget;


      button.classList.add(
        "flash"
      );


      setTimeout(() => {

        button.classList.remove(
          "flash"
        );

      }, 250);


      let randomIndex;


      do {

        randomIndex =
          Math.floor(
            Math.random() *
            currentPlaylist.length
          );

      }

      while (
        randomIndex ===
        currentSongIndex
      );


      currentSongIndex =
        randomIndex;


      playExactVideo(
        currentPlaylist[
          randomIndex
        ]
      );

    }
  );

}


// ================================================================
// UNLOCK AUDIO
// ================================================================

function unlockAudio() {

  if (
    audioUnlocked ||
    !playerReady
  ) {

    return;

  }


  audioUnlocked =
    true;


  player.unMute();

  player.setVolume(
    100
  );


  document.removeEventListener(
    "click",
    unlockAudio
  );


  document.removeEventListener(
    "touchstart",
    unlockAudio
  );

}


document.addEventListener(
  "click",
  unlockAudio
);


document.addEventListener(
  "touchstart",
  unlockAudio
);


// ================================================================
// MUSIC LIBRARY
// ================================================================

const libraryBtn =
  document.getElementById(
    "libraryBtn"
  );


const libraryClose =
  document.getElementById(
    "libraryClose"
  );


const libraryOverlay =
  document.getElementById(
    "libraryOverlay"
  );


const musicLibrary =
  document.getElementById(
    "musicLibrary"
  );


// ================================================================
// OPEN LIBRARY
// ================================================================

function openLibrary() {

  if (musicLibrary) {

    musicLibrary.classList.add(
      "open"
    );

  }


  if (libraryOverlay) {

    libraryOverlay.classList.add(
      "open"
    );

  }


  browsingAlbumIndex =
    currentAlbumIndex;


  renderAlbums();

}


// ================================================================
// CLOSE LIBRARY
// ================================================================

function closeLibrary() {

  if (musicLibrary) {

    musicLibrary.classList.remove(
      "open"
    );

  }


  if (libraryOverlay) {

    libraryOverlay.classList.remove(
      "open"
    );

  }

}


if (libraryBtn) {

  libraryBtn.addEventListener(
    "click",
    openLibrary
  );

}


if (libraryClose) {

  libraryClose.addEventListener(
    "click",
    closeLibrary
  );

}


if (libraryOverlay) {

  libraryOverlay.addEventListener(
    "click",
    closeLibrary
  );

}


// ================================================================
// ESC CLOSES LIBRARY
// ================================================================

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key ===
      "Escape"
    ) {

      closeLibrary();

    }

  }
);


// ================================================================
// RENDER ALBUMS
// ================================================================

function renderAlbums() {

  const albumList =
    document.getElementById(
      "albumList"
    );


  if (!albumList) {

    return;

  }


  albumList.innerHTML =
    "";


  ALBUMS.forEach(
    (
      album,
      index
    ) => {

      const albumItem =
        document.createElement(
          "div"
        );


      albumItem.className =
        "album-item" +
        (
          index ===
          browsingAlbumIndex
            ? " active"
            : ""
        );


      albumItem.innerHTML =
        `
        <span class="album-number">
          ${String(
            index + 1
          ).padStart(2, "0")}
        </span>

        <span class="album-name">
          ${album.name}
        </span>
        `;


      albumItem.addEventListener(
        "click",
        () => {

          selectLibraryAlbum(
            index
          );

        }
      );


      albumList.appendChild(
        albumItem
      );

    }
  );


  renderLibrarySongs(
    browsingAlbumIndex,
    ++libraryRequestId
  );

}


// ================================================================
// SELECT ALBUM FOR BROWSING
// ================================================================

function selectLibraryAlbum(
  index
) {

  const album =
    ALBUMS[index];


  if (!album) {

    return;

  }


  // IMPORTANT:
  // This only changes browsing album.
  // It does NOT change playing album.

  browsingAlbumIndex =
    index;


  const requestId =
    ++libraryRequestId;


  document
    .querySelectorAll(
      ".album-item"
    )
    .forEach(
      (
        item,
        itemIndex
      ) => {

        item.classList.toggle(
          "active",
          itemIndex === index
        );

      }
    );


  const albumName =
    document.getElementById(
      "libraryAlbumName"
    );


  if (albumName) {

    albumName.textContent =
      album.name;

  }


  renderLibrarySongs(
    index,
    requestId
  );

}


// ================================================================
// RENDER LIBRARY SONGS
// ================================================================

async function renderLibrarySongs(
  albumIndex,
  requestId
) {

  const songList =
    document.getElementById(
      "librarySongList"
    );


  const albumName =
    document.getElementById(
      "libraryAlbumName"
    );


  if (!songList) {

    return;

  }


  const album =
    ALBUMS[albumIndex];


  if (!album) {

    return;

  }


  if (albumName) {

    albumName.textContent =
      album.name;

  }


  // ------------------------------------------------
  // SHOW LOADING
  // ------------------------------------------------

  songList.innerHTML =
    `
    <div class="library-empty">
      Loading songs...
    </div>
    `;


  // ------------------------------------------------
  // USE CACHE FIRST
  // ------------------------------------------------

  const cachedPlaylist =
    playlistCache.get(
      album.playlistId
    );


  if (
    cachedPlaylist &&
    cachedPlaylist.length > 0
  ) {

    if (
      requestId !==
      libraryRequestId
    ) {

      return;

    }


    renderLibrarySongRows(
      cachedPlaylist,
      album,
      songList
    );


    return;

  }


  // ------------------------------------------------
  // CREATE TEMPORARY PLAYER
  // ------------------------------------------------

  const tempContainer =
    document.createElement(
      "div"
    );


  tempContainer.style.position =
    "absolute";

  tempContainer.style.width =
    "1px";

  tempContainer.style.height =
    "1px";

  tempContainer.style.opacity =
    "0";

  tempContainer.style.pointerEvents =
    "none";


  document.body.appendChild(
    tempContainer
  );


  let tempPlayer = null;


  try {

    tempPlayer =
      new YT.Player(
        tempContainer,
        {

          height:
            "1",

          width:
            "1",

          playerVars: {

            listType:
              "playlist",

            list:
              album.playlistId,

            autoplay:
              0,

            mute:
              1,

            controls:
              0,

            playsinline:
              1

          },


          events: {

            onReady:
              function(event) {

                try {

                  if (
                    requestId !==
                    libraryRequestId
                  ) {

                    destroyTempPlayer(
                      event.target,
                      tempContainer
                    );

                    return;

                  }


                  const playlist =
                    event.target
                      .getPlaylist() ||
                    [];


                  // ------------------------------------------------
                  // CACHE PLAYLIST
                  // ------------------------------------------------

                  if (
                    playlist.length > 0
                  ) {

                    playlistCache.set(
                      album.playlistId,
                      playlist
                    );

                  }


                  renderLibrarySongRows(
                    playlist,
                    album,
                    songList
                  );

                }

                catch (error) {

                  console.error(
                    "Library playlist error:",
                    error
                  );

                }


                destroyTempPlayer(
                  event.target,
                  tempContainer
                );

              },


            onError:
              function() {

                if (
                  requestId ===
                  libraryRequestId
                ) {

                  songList.innerHTML =
                    `
                    <div class="library-empty">
                      Unable to load songs
                    </div>
                    `;

                }


                destroyTempPlayer(
                  tempPlayer,
                  tempContainer
                );

              }

          }

        }
      );

  }

  catch (error) {

    console.error(
      "Could not load library:",
      error
    );


    songList.innerHTML =
      `
      <div class="library-empty">
        Unable to load songs
      </div>
      `;

  }

}


// ================================================================
// DESTROY TEMP PLAYER
// ================================================================

function destroyTempPlayer(
  tempPlayer,
  container
) {

  try {

    if (
      tempPlayer &&
      typeof tempPlayer.destroy ===
      "function"
    ) {

      tempPlayer.destroy();

    }

  }

  catch (error) {}


  if (
    container &&
    container.parentNode
  ) {

    container.parentNode.removeChild(
      container
    );

  }

}


// ================================================================
// RENDER LIBRARY SONG ROWS
// ================================================================

function renderLibrarySongRows(
  playlist,
  album,
  songList
) {

  if (
    !playlist ||
    playlist.length === 0
  ) {

    songList.innerHTML =
      `
      <div class="library-empty">
        No songs found
      </div>
      `;

    return;

  }


  songList.innerHTML =
    "";


  playlist.forEach(
    (
      videoId,
      songIndex
    ) => {

      const song =
        document.createElement(
          "div"
        );


      const isCurrentSong =
        (
          ALBUMS.indexOf(album) ===
          currentAlbumIndex
        ) &&
        (
          songIndex ===
          currentSongIndex
        );


      song.className =
        "library-song" +
        (
          isCurrentSong
            ? " active"
            : ""
        );


      song.innerHTML =
        `

        <div class="library-song-number">
          ${String(
            songIndex + 1
          ).padStart(2, "0")}
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


      // ============================================================
      // CLICK EXACT SONG
      // ============================================================

      song.addEventListener(
        "click",
        () => {

          const albumIndex =
            ALBUMS.indexOf(
              album
            );


          if (
            albumIndex === -1
          ) {

            return;

          }


          console.log(
            "Playing exact song:",
            album.name,
            songIndex,
            videoId
          );


          // ------------------------------------------------
          // SAVE PLAYING ALBUM
          // ------------------------------------------------

          currentAlbumIndex =
            albumIndex;


          // ------------------------------------------------
          // SAVE COMPLETE PLAYLIST
          // ------------------------------------------------

          currentPlaylist =
            playlist;


          playlistCache.set(
            album.playlistId,
            playlist
          );


          // ------------------------------------------------
          // SAVE EXACT SONG INDEX
          // ------------------------------------------------

          currentSongIndex =
            songIndex;


          // ------------------------------------------------
          // PLAY EXACT VIDEO
          // ------------------------------------------------

          playExactVideo(
            videoId
          );


          // ------------------------------------------------
          // CLOSE LIBRARY
          // ------------------------------------------------

          closeLibrary();

        }
      );


      songList.appendChild(
        song
      );


      // ------------------------------------------------
      // LOAD SONG DETAILS
      // ------------------------------------------------

      getYouTubeVideoInfo(
        videoId
      )
        .then(
          (info) => {

            const titleElement =
              song.querySelector(
                ".library-song-title"
              );


            const artistElement =
              song.querySelector(
                ".library-song-artist"
              );


            if (
              titleElement
            ) {

              titleElement.textContent =
                info.title;

            }


            if (
              artistElement
            ) {

              artistElement.textContent =
                info.artist;

            }

          }
        )
        .catch(() => {});

    }
  );

}


// ================================================================
// HIGHLIGHT CURRENT SONG
// ================================================================

function updateLibraryActiveSong(
  index
) {

  const songs =
    document.querySelectorAll(
      ".library-song"
    );


  songs.forEach(
    (
      song,
      songIndex
    ) => {

      song.classList.toggle(
        "active",

        songIndex === index &&
        browsingAlbumIndex ===
        currentAlbumIndex
      );

    }
  );

}


// ================================================================
// WALLPAPERS
// ================================================================

const WALLPAPERS = [

  {
    type: "image",
    src: "/1.png"
  },

  {
    type: "image",
    src: "/2.jpg"
  },

  {
    type: "image",
    src: "/3.jpg"
  },

  {
    type: "image",
    src: "/4.jpg"
  },

  {
    type: "image",
    src: "/seedhemaut.jpg"
  },

  {
    type: "video",
    src: "/nalla freestyle.mp4"
  }

];


let wallpaperIndex =
  0;


const wallpaperBtn =
  document.getElementById(
    "wallpaperBtn"
  );


const wallpaperVideo =
  document.getElementById(
    "wallpaperVideo"
  );


// ================================================================
// CHANGE WALLPAPER
// ================================================================

function changeWallpaper() {

  wallpaperIndex++;


  if (
    wallpaperIndex >=
    WALLPAPERS.length
  ) {

    wallpaperIndex =
      0;

  }


  const wallpaper =
    WALLPAPERS[
      wallpaperIndex
    ];


  // ------------------------------------------------
  // IMAGE
  // ------------------------------------------------

  if (
    wallpaper.type ===
    "image"
  ) {

    if (
      wallpaperVideo
    ) {

      wallpaperVideo.pause();

      wallpaperVideo.style.display =
        "none";

    }


    document.body.style.backgroundImage =
      `url("${wallpaper.src}")`;


    document.body.style.backgroundSize =
      "cover";


    document.body.style.backgroundPosition =
      "center";


    document.body.style.backgroundRepeat =
      "no-repeat";


    document.body.style.backgroundAttachment =
      "fixed";

  }


  // ------------------------------------------------
  // VIDEO
  // ------------------------------------------------

  else if (
    wallpaper.type ===
    "video"
  ) {

    document.body.style.backgroundImage =
      "none";


    if (
      wallpaperVideo
    ) {

      wallpaperVideo.src =
        wallpaper.src;


      wallpaperVideo.style.display =
        "block";


      wallpaperVideo.currentTime =
        0;


      wallpaperVideo
        .play()
        .catch(() => {});

    }

  }

}


if (wallpaperBtn) {

  wallpaperBtn.addEventListener(
    "click",
    (event) => {

      const button =
        event.currentTarget;


      button.classList.add(
        "flash"
      );


      setTimeout(() => {

        button.classList.remove(
          "flash"
        );

      }, 250);


      changeWallpaper();

    }
  );

}


// ================================================================
// TBSM AUDIO
// ================================================================

const TBSM_AUDIO_SRC =
  "/nalla freestyle.mp4";


const tbsmAudioEl =
  document.getElementById(
    "tbsmAudio"
  );


if (
  tbsmAudioEl &&
  TBSM_AUDIO_SRC
) {

  tbsmAudioEl.src =
    TBSM_AUDIO_SRC;

}


const tbsmAudioBtn =
  document.getElementById(
    "tbsmAudioBtn"
  );


if (tbsmAudioBtn) {

  tbsmAudioBtn.addEventListener(
    "click",
    (event) => {

      const button =
        event.currentTarget;


      button.classList.add(
        "flash"
      );


      setTimeout(() => {

        button.classList.remove(
          "flash"
        );

      }, 250);


      if (
        !tbsmAudioEl ||
        !TBSM_AUDIO_SRC
      ) {

        return;

      }


      if (
        tbsmAudioEl.paused
      ) {

        tbsmAudioEl.currentTime =
          0;


        tbsmAudioEl
          .play()
          .catch(() => {});

      }


      else {

        tbsmAudioEl.pause();

      }

    }
  )};
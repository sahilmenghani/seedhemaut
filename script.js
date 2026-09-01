// ================================================================
// LIVE TIME
// ================================================================

function updateTime() {
  const timeElement = document.getElementById("currentTime");

  if (!timeElement) return;

  timeElement.textContent = new Date().toLocaleTimeString("en-IN", {
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

const ALBUMS = [
  {
    name: "Lunch Break",
    playlistId: "PLaT0GyWvzyqgkGtIG6WmfCmpgrv2zPYMD",
  },
  {
    name: "Nayaab",
    playlistId: "PLVhh-pNjr3-A",
  },
  {
    name: "Bayaan",
    playlistId: "PLkEICesI2qi4XQwD9IxUNXzRgmMnJ_ucE",
  },
  {
    name: "न",
    playlistId: "PLaT0GyWvzyqijYNsKTo9mna6Txzt8qovn",
  },
  {
    name: "Shakti",
    playlistId: "OLAK5uy_lsIzlLpNhudxplsDw5YPUrXX0chzHpNwM",
  },
  {
    name: "Kshama",
    playlistId: "OLAK5uy_kjAh3eyV9-Lv73su7nsQ1zfxwx--IShVg",
  },
  {
    name: "DL91",
    playlistId: "OLAK5uy_kWDW8_A90JNXKEUgynxrBuLGh6I4Z1F0w",
  },
  {
    name: "EE",
    playlistId: "PL2WhG2MTtzX6mI0Za_pL8nYAhEzinkkwT",
  },
  {
    name: "Penthouse Tapes",
    playlistId: "PLdxwh8I3IjCCa-VW3QBnQ5T-GsD2iFkUb",
  },
  {
    name: "Single Drops",
    playlistId: "PLFmqtYxbf4L8",
  },
  {
    name: "Features",
    playlistId: "PLfV8lh2hpJBg",
  },
];


// ================================================================
// PLAYER STATE
// ================================================================

let player = null;
let playerReady = false;
let audioUnlocked = false;

let progressInterval = null;

let currentAlbumIndex = 0;
let browsingAlbumIndex = 0;

let currentVideoId = null;
let currentPlaylist = [];
let currentSongIndex = 0;

const playlistCache = new Map();
const videoInfoCache = new Map();

let libraryRequestId = 0;
let playlistLoadRequestId = 0;
let searchRequestId = 0;

let isLoadingAllPlaylists = false;


// ================================================================
// LOAD YOUTUBE API
// ================================================================

const youtubeScript = document.createElement("script");

youtubeScript.src =
  "https://www.youtube.com/iframe_api";

document.head.appendChild(youtubeScript);


// ================================================================
// CREATE PLAYER
// ================================================================

function onYouTubeIframeAPIReady() {

  player = new YT.Player("yt-player", {

    height: "1",
    width: "1",

    playerVars: {

      listType: "playlist",

      list:
        ALBUMS[currentAlbumIndex].playlistId,

      autoplay: 1,

      mute: 1,

      controls: 0,

      playsinline: 1,

    },

    events: {

      onReady: onPlayerReady,

      onStateChange: onPlayerStateChange,

      onError: onPlayerError,

    },

  });

}

window.onYouTubeIframeAPIReady =
  onYouTubeIframeAPIReady;


// ================================================================
// PLAYER READY
// ================================================================

function onPlayerReady(event) {

  playerReady = true;

  event.target.mute();

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
// PLAYER STATE
// ================================================================

function onPlayerStateChange(event) {

  const state = event.data;


  if (
    state ===
    YT.PlayerState.PLAYING
  ) {

    setPlayingUI(true);

    updateNowPlayingInfo();

    syncCurrentSongWithVideo();

    return;

  }


  if (
    state ===
    YT.PlayerState.PAUSED
  ) {

    setPlayingUI(false);

    return;

  }


  if (
    state ===
    YT.PlayerState.ENDED
  ) {

    playNextSong();

    return;

  }


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

  const maxAttempts = 40;


  const interval =
    setInterval(() => {

      attempts++;


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


          playlistCache.set(
            playlistId,
            playlist
          );


          currentPlaylist =
            playlist;


          if (
            songIndex >=
            playlist.length
          ) {

            songIndex = 0;

          }


          currentSongIndex =
            songIndex;


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
  ) return;


  const album =
    ALBUMS[albumIndex];


  if (!album) return;


  currentAlbumIndex =
    albumIndex;


  const cachedPlaylist =
    playlistCache.get(
      album.playlistId
    );


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


  player.loadPlaylist({

    listType:
      "playlist",

    list:
      album.playlistId,

    index: 0,

    startSeconds: 0,

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
  ) return;


  currentVideoId =
    videoId;


  player.loadVideoById({

    videoId:
      videoId,

    startSeconds: 0,

  });


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
// NEXT SONG
// ================================================================

function playNextSong() {

  if (
    !currentPlaylist ||
    currentPlaylist.length === 0
  ) return;


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


  const nextAlbumIndex =
    (
      currentAlbumIndex + 1
    ) %
    ALBUMS.length;


  loadAlbumForPlayback(
    nextAlbumIndex,
    0
  );

}


// ================================================================
// PREVIOUS SONG
// ================================================================

function playPreviousSong() {

  if (
    !playerReady ||
    !player ||
    !currentPlaylist ||
    currentPlaylist.length === 0
  ) return;


  if (
    currentSongIndex > 0
  ) {

    currentSongIndex--;

    playExactVideo(
      currentPlaylist[
        currentSongIndex
      ]
    );

    return;

  }


  const previousAlbumIndex =
    (
      currentAlbumIndex - 1 +
      ALBUMS.length
    ) %
    ALBUMS.length;


  const previousAlbum =
    ALBUMS[
      previousAlbumIndex
    ];


  const cachedPlaylist =
    playlistCache.get(
      previousAlbum.playlistId
    );


  currentAlbumIndex =
    previousAlbumIndex;


  if (
    cachedPlaylist &&
    cachedPlaylist.length > 0
  ) {

    currentPlaylist =
      cachedPlaylist;

    currentSongIndex =
      currentPlaylist.length - 1;


    playExactVideo(
      currentPlaylist[
        currentSongIndex
      ]
    );

    return;

  }


  loadAlbumForPlayback(
    previousAlbumIndex,
    0
  );

}


// ================================================================
// SYNC SONG
// ================================================================

function syncCurrentSongWithVideo() {

  if (
    !currentVideoId ||
    !currentPlaylist
  ) return;


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
// PLAYING UI
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
  ) return;


  if (isPlaying) {

    playIcon.innerHTML =
      `
      <rect x="6" y="5" width="4" height="14"></rect>
      <rect x="14" y="5" width="4" height="14"></rect>
      `;

    disc.classList.add(
      "spinning"
    );

  }

  else {

    playIcon.innerHTML =
      `
      <path d="M8 5v14l11-7z"></path>
      `;

    disc.classList.remove(
      "spinning"
    );

  }

}


// ================================================================
// NOW PLAYING INFO
// ================================================================

function updateNowPlayingInfo() {

  if (
    !playerReady ||
    !player
  ) return;


  try {

    const data =
      player.getVideoData();


    if (
      data &&
      data.video_id
    ) {

      currentVideoId =
        data.video_id;


      const trackTitle =
        document.getElementById(
          "trackTitle"
        );


      const albumArt =
        document.getElementById(
          "albumArt"
        );


      if (trackTitle) {

        trackTitle.textContent =
          data.title ||
          "Unknown Song";

      }


      if (albumArt) {

        albumArt.src =
          `https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`;

      }


      syncCurrentSongWithVideo();

      updateLibraryActiveSong(
        currentSongIndex
      );

    }

  }

  catch (error) {

    console.error(
      "Could not update song information:",
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
      ) return;


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

          progressFill.style.width =
            `${(
              currentTime /
              duration
            ) * 100}%`;

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

      }

      catch (error) {}

    }, 500);

}


// ================================================================
// VIDEO INFORMATION
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
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,

    };


    videoInfoCache.set(
      videoId,
      info
    );


    return info;

  }

  catch (error) {

    return {

      title:
        "Unknown Song",

      artist:
        "Seedhe Maut",

      thumbnail:
        `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,

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

const prevBtn =
  document.getElementById(
    "prevBtn"
  );

const nextBtn =
  document.getElementById(
    "nextBtn"
  );

const progressBar =
  document.getElementById(
    "progressBar"
  );

const shuffleBtn =
  document.getElementById(
    "shuffleBtn"
  );


// PLAY

if (playBtn) {

  playBtn.addEventListener(
    "click",
    () => {

      if (!playerReady) return;


      if (
        player.getPlayerState() ===
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


// PREVIOUS

if (prevBtn) {

  prevBtn.addEventListener(
    "click",
    playPreviousSong
  );

}


// NEXT

if (nextBtn) {

  nextBtn.addEventListener(
    "click",
    playNextSong
  );

}


// PROGRESS CLICK

if (progressBar) {

  progressBar.addEventListener(
    "click",
    (event) => {

      if (!playerReady) return;


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


// SHUFFLE

if (shuffleBtn) {

  shuffleBtn.addEventListener(
    "click",
    () => {

      if (
        !currentPlaylist ||
        currentPlaylist.length < 2
      ) return;


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
// AUDIO UNLOCK
// ================================================================

function unlockAudio() {

  if (
    audioUnlocked ||
    !playerReady
  ) return;


  audioUnlocked =
    true;


  player.unMute();

  player.setVolume(100);


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
// VOLUME
// ================================================================

const volumeSlider =
  document.getElementById(
    "volumeSlider"
  );


if (volumeSlider) {

  volumeSlider.addEventListener(
    "input",
    () => {

      if (
        !playerReady ||
        !player
      ) return;


      player.setVolume(
        Number(
          volumeSlider.value
        )
      );

    }
  );

}


// ================================================================
// MUSIC LIBRARY ELEMENTS
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

const librarySearchBtn =
  document.getElementById(
    "librarySearchBtn"
  );

const librarySearchBox =
  document.getElementById(
    "librarySearchBox"
  );

const librarySearch =
  document.getElementById(
    "librarySearch"
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


  // Load all playlists in background
  // This makes global search work across all albums

  loadAllPlaylistsForSearch();

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


  if (librarySearchBox) {

    librarySearchBox.classList.remove(
      "open"
    );

  }


  if (librarySearch) {

    librarySearch.value =
      "";

  }

}


// ================================================================
// LIBRARY BUTTON EVENTS
// ================================================================

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


  if (!albumList) return;


  albumList.innerHTML =
    "";


  ALBUMS.forEach(
    (album, index) => {

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
// SELECT LIBRARY ALBUM
// ================================================================

function selectLibraryAlbum(
  index
) {

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


  if (librarySearch) {

    librarySearch.value =
      "";

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


  if (!songList) return;


  const album =
    ALBUMS[albumIndex];


  if (!album) return;


  if (albumName) {

    albumName.textContent =
      album.name;

  }


  const cachedPlaylist =
    playlistCache.get(
      album.playlistId
    );


  if (
    cachedPlaylist &&
    cachedPlaylist.length > 0
  ) {

    renderLibrarySongRows(
      cachedPlaylist,
      album,
      songList
    );

    return;

  }


  songList.innerHTML =
    `
    <div class="library-empty">
      Loading songs...
    </div>
    `;


  const playlist =
    await loadPlaylistWithTempPlayer(
      album.playlistId
    );


  if (
    requestId !==
    libraryRequestId
  ) return;


  if (
    playlist &&
    playlist.length > 0
  ) {

    renderLibrarySongRows(
      playlist,
      album,
      songList
    );

  }

  else {

    songList.innerHTML =
      `
      <div class="library-empty">
        Unable to load songs
      </div>
      `;

  }

}


// ================================================================
// TEMP PLAYER PLAYLIST LOADER
// ================================================================

function loadPlaylistWithTempPlayer(
  playlistId
) {

  return new Promise(
    (resolve) => {

      if (
        playlistCache.has(
          playlistId
        )
      ) {

        resolve(
          playlistCache.get(
            playlistId
          )
        );

        return;

      }


      const container =
        document.createElement(
          "div"
        );


      container.style.position =
        "absolute";

      container.style.width =
        "1px";

      container.style.height =
        "1px";

      container.style.opacity =
        "0";

      container.style.pointerEvents =
        "none";


      document.body.appendChild(
        container
      );


      let resolved =
        false;


      const finish =
        (
          playlist,
          tempPlayer
        ) => {

          if (resolved) return;

          resolved = true;


          if (
            playlist &&
            playlist.length > 0
          ) {

            playlistCache.set(
              playlistId,
              playlist
            );

          }


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
            container.parentNode
          ) {

            container.parentNode.removeChild(
              container
            );

          }


          resolve(
            playlist || []
          );

        };


      try {

        const tempPlayer =
          new YT.Player(
            container,
            {

              height: "1",
              width: "1",

              playerVars: {

                listType:
                  "playlist",

                list:
                  playlistId,

                autoplay:
                  0,

                mute:
                  1,

                controls:
                  0,

              },


              events: {

                onReady:
                  function(event) {

                    let attempts = 0;


                    const check =
                      setInterval(() => {

                        attempts++;


                        try {

                          const playlist =
                            event.target.getPlaylist() ||
                            [];


                          if (
                            playlist.length > 0
                          ) {

                            clearInterval(
                              check
                            );

                            finish(
                              playlist,
                              event.target
                            );

                          }


                          else if (
                            attempts >= 30
                          ) {

                            clearInterval(
                              check
                            );

                            finish(
                              [],
                              event.target
                            );

                          }

                        }

                        catch (error) {

                          clearInterval(
                            check
                          );

                          finish(
                            [],
                            event.target
                          );

                        }

                      }, 150);

                  },


                onError:
                  function() {

                    finish(
                      [],
                      null
                    );

                  },

              },

            }
          );

      }

      catch (error) {

        resolve([]);

      }

    }
  );

}


// ================================================================
// LOAD ALL PLAYLISTS FOR GLOBAL SEARCH
// ================================================================

async function loadAllPlaylistsForSearch() {

  if (
    isLoadingAllPlaylists
  ) return;


  isLoadingAllPlaylists =
    true;


  try {

    // Sequential loading prevents too many YouTube
    // players from being created simultaneously.

    for (
      const album of ALBUMS
    ) {

      if (
        playlistCache.has(
          album.playlistId
        )
      ) {

        continue;

      }


      await loadPlaylistWithTempPlayer(
        album.playlistId
      );

    }

  }

  catch (error) {

    console.error(
      "Global playlist loading error:",
      error
    );

  }


  isLoadingAllPlaylists =
    false;

}


// ================================================================
// RENDER SONG ROWS
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


      const albumIndex =
        ALBUMS.indexOf(
          album
        );


      const isCurrentSong =
        (
          albumIndex ===
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


      song.addEventListener(
        "click",
        () => {

          playLibrarySong(
            albumIndex,
            playlist,
            songIndex,
            videoId
          );

        }
      );


      songList.appendChild(
        song
      );


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


            if (titleElement) {

              titleElement.textContent =
                info.title;

            }


            if (artistElement) {

              artistElement.textContent =
                info.artist;

            }

          }
        );

    }
  );

}


// ================================================================
// PLAY LIBRARY SONG
// ================================================================

function playLibrarySong(
  albumIndex,
  playlist,
  songIndex,
  videoId
) {

  currentAlbumIndex =
    albumIndex;


  currentPlaylist =
    playlist;


  currentSongIndex =
    songIndex;


  playlistCache.set(
    ALBUMS[albumIndex].playlistId,
    playlist
  );


  playExactVideo(
    videoId
  );


  closeLibrary();

}


// ================================================================
// ACTIVE SONG
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
// SEARCH OPEN / CLOSE
// ================================================================

if (librarySearchBtn) {

  librarySearchBtn.addEventListener(
    "click",
    () => {

      if (!librarySearchBox) return;


      librarySearchBox.classList.toggle(
        "open"
      );


      if (
        librarySearchBox.classList.contains(
          "open"
        )
      ) {

        setTimeout(
          () => {

            if (librarySearch) {

              librarySearch.focus();

            }

          },
          300
        );

      }

      else if (
        librarySearch
      ) {

        librarySearch.value =
          "";

        renderLibrarySongs(
          browsingAlbumIndex,
          ++libraryRequestId
        );

      }

    }
  );

}


// ================================================================
// GET ALL SONGS
// ================================================================

function getAllCachedSongs() {

  const allSongs = [];


  ALBUMS.forEach(
    (
      album,
      albumIndex
    ) => {

      const playlist =
        playlistCache.get(
          album.playlistId
        );


      if (!playlist) return;


      playlist.forEach(
        (
          videoId,
          songIndex
        ) => {

          allSongs.push({

            videoId,

            albumName:
              album.name,

            albumIndex,

            songIndex,

          });

        }
      );

    }
  );


  return allSongs;

}


// ================================================================
// GLOBAL SEARCH
// ================================================================

async function renderSearchResults(
  query
) {

  const songList =
    document.getElementById(
      "librarySongList"
    );

  const albumName =
    document.getElementById(
      "libraryAlbumName"
    );


  if (!songList) return;


  const searchQuery =
    query
      .toLowerCase()
      .trim();


  // EMPTY SEARCH → NORMAL ALBUM

  if (!searchQuery) {

    if (albumName) {

      albumName.textContent =
        ALBUMS[
          browsingAlbumIndex
        ].name;

    }


    renderLibrarySongs(
      browsingAlbumIndex,
      ++libraryRequestId
    );

    return;

  }


  const requestId =
    ++searchRequestId;


  // Make sure all playlists have loaded

  songList.innerHTML =
    `
    <div class="library-empty">
      Searching bangers 🐉...
    </div>
    `;


  await loadAllPlaylistsForSearch();


  const allSongs =
    getAllCachedSongs();


  // Get song information

  const songsWithInfo =
    await Promise.all(

      allSongs.map(
        async (
          song
        ) => {

          const info =
            await getYouTubeVideoInfo(
              song.videoId
            );


          return {

            ...song,

            title:
              info.title,

            artist:
              info.artist,

          };

        }
      )

    );


  // Ignore outdated search

  if (
    requestId !==
    searchRequestId
  ) return;


  const results =
    songsWithInfo.filter(
      (
        song
      ) => {

        return (

          song.title
            .toLowerCase()
            .includes(
              searchQuery
            ) ||

          song.artist
            .toLowerCase()
            .includes(
              searchQuery
            ) ||

          song.albumName
            .toLowerCase()
            .includes(
              searchQuery
            )

        );

      }
    );


  if (albumName) {

    albumName.textContent =
      `SEARCH RESULTS (${results.length})`;

  }


  if (
    results.length === 0
  ) {

    songList.innerHTML =
      `
      <div class="library-empty">
        No bangers found 🐉
      </div>
      `;

    return;

  }


  songList.innerHTML =
    "";


  results.forEach(
    (
      song,
      index
    ) => {

      const songElement =
        document.createElement(
          "div"
        );


      songElement.className =
        "library-song";


      songElement.innerHTML =
        `
        <div class="library-song-number">
          ${String(
            index + 1
          ).padStart(2, "0")}
        </div>

        <div class="library-cover">

          <img
            src="https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg"
            alt=""
          >

        </div>

        <div class="library-song-info">

          <div class="library-song-title">
            ${song.title}
          </div>

          <div class="library-song-artist">
            ${song.albumName}
          </div>

        </div>
        `;


      songElement.addEventListener(
        "click",
        () => {

          playSearchResult(
            song
          );

        }
      );


      songList.appendChild(
        songElement
      );

    }
  );

}


// ================================================================
// PLAY SEARCH RESULT
// ================================================================

function playSearchResult(
  song
) {

  const album =
    ALBUMS[
      song.albumIndex
    ];


  if (!album) return;


  const playlist =
    playlistCache.get(
      album.playlistId
    );


  if (
    !playlist ||
    playlist.length === 0
  ) return;


  currentAlbumIndex =
    song.albumIndex;


  currentPlaylist =
    playlist;


  currentSongIndex =
    song.songIndex;


  playExactVideo(
    song.videoId
  );


  closeLibrary();

}


// ================================================================
// SEARCH INPUT
// ================================================================

if (librarySearch) {

  librarySearch.addEventListener(
    "input",
    () => {

      renderSearchResults(
        librarySearch.value
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
    src: "/2.jpg",
  },
  {
    type: "image",
    src: "/seedhemaut.jpg",
  },
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


function changeWallpaper() {

  wallpaperIndex =
    (
      wallpaperIndex + 1
    ) %
    WALLPAPERS.length;


  const wallpaper =
    WALLPAPERS[
      wallpaperIndex
    ];


  if (
    wallpaper.type ===
    "image"
  ) {

    if (wallpaperVideo) {

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

}


if (wallpaperBtn) {

  wallpaperBtn.addEventListener(
    "click",
    () => {

      changeWallpaper();

    }
  );

}


// ================================================================
// TBSM AUDIO
// ================================================================

const TBSM_AUDIO_SRC =
  "";


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
    () => {

      if (
        !tbsmAudioEl ||
        !TBSM_AUDIO_SRC
      ) return;


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
  );

}
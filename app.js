// Global State
let songList = [];
let selectedSong = 0;
let audio = new Audio();
let isPlaying = false;
let isRepeated = false;

// DOM Elements
const allSongContainer = document.querySelector('#allsongs');
const searchInput = document.querySelector('#search-input');
const playBtn = document.querySelector('.play-btn');
const nextBtn = document.querySelector('.next-btn');
const prevBtn = document.querySelector('.previous-btn');
const repeatBtn = document.querySelector('.repeat-btn');
const mainPoster = document.querySelector('#main-poster');
const miniPoster = document.querySelector('#mini-poster');
const currTitle = document.querySelector('#curr-title');
const bgOverlay = document.querySelector('#bg-overlay');
const progress = document.querySelector('#progress');
const timeline = document.querySelector('#timeline');
const volumeSlider = document.querySelector('#volume-slider');
const volProgress = document.querySelector('.slider-progress');

/**
 * 1. FETCH MUSIC FROM API (PURE JS)
 * Fetches up to 200 songs at a time (API Limit per request).
 */
async function fetchMusic(query = "Top Hits", limit = 200) {
    try {
        allSongContainer.innerHTML = `
            <div class="flex flex-col items-center justify-center p-10 text-gray-500">
                <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500 mb-2"></div>
                <p class="text-xs uppercase tracking-widest">Scanning Library...</p>
            </div>`;
        
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=${limit}&entity=song`);
        const data = await response.json();
        
        songList = data.results.map(track => ({
            songName: track.trackName,
            artist: track.artistName,
            songUrl: track.previewUrl, 
            img: track.artworkUrl100.replace('100x100', '1000x1000') // Fetch HD quality
        }));

        if (songList.length > 0) {
            renderPlaylist();
            loadSong(0, false); // Initialize but wait for user to hit play
        } else {
            allSongContainer.innerHTML = `<div class="p-10 text-center text-red-400">No tracks found. Try a different search.</div>`;
        }
    } catch (error) {
        allSongContainer.innerHTML = `<div class="p-10 text-center text-red-500">API Connection Failed.</div>`;
    }
}

/**
 * 2. RENDER THE DYNAMIC LIST
 */
function renderPlaylist() {
    let clutter = "";
    songList.forEach((song, idx) => {
        const isActive = selectedSong === idx;
        clutter += `
        <div class="song-card flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 ${isActive ? 'bg-white/10 border-l-4 border-green-500' : 'hover:bg-white/5'}" onclick="selectTrack(${idx})">
            <div class="flex items-center gap-4 overflow-hidden pointer-events-none">
                <img src="${song.img}" class="w-12 h-12 rounded-lg object-cover shadow-lg">
                <div class="overflow-hidden">
                    <h3 class="text-sm font-semibold truncate ${isActive ? 'text-green-400' : 'text-white'}">${song.songName}</h3>
                    <p class="text-[10px] text-gray-500 truncate uppercase tracking-tighter">${song.artist}</p>
                </div>
            </div>
            ${isActive ? '<i class="ri-volume-vibrate-fill text-green-500"></i>' : '<i class="ri-play-circle-line text-gray-600"></i>'}
        </div>`;
    });
    allSongContainer.innerHTML = clutter;
}

/**
 * 3. CORE PLAYER LOGIC
 */
function loadSong(idx, shouldPlay = true) {
    selectedSong = idx;
    const song = songList[idx];
    
    audio.src = song.songUrl;
    mainPoster.src = song.img;
    miniPoster.src = song.img;
    currTitle.innerText = song.songName;
    
    // Smooth Parallax Background Update
    bgOverlay.style.backgroundImage = `url(${song.img})`;
    bgOverlay.style.backgroundSize = 'cover';
    bgOverlay.style.backgroundPosition = 'center';
    
    renderPlaylist(); // Update visuals in the list
    
    if (shouldPlay) {
        audio.play();
        isPlaying = true;
        playBtn.innerHTML = `<i class="ri-pause-fill text-2xl"></i>`;
    }
}

function selectTrack(idx) {
    loadSong(idx, true);
}

// Search Event
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim() !== "") {
        fetchMusic(searchInput.value, 200);
    }
});

// Play/Pause Button
playBtn.addEventListener('click', () => {
    if (audio.src) {
        if (audio.paused) {
            audio.play();
            playBtn.innerHTML = `<i class="ri-pause-fill text-2xl"></i>`;
            isPlaying = true;
        } else {
            audio.pause();
            playBtn.innerHTML = `<i class="ri-play-fill text-2xl"></i>`;
            isPlaying = false;
        }
    }
});

// Next/Prev Navigation
nextBtn.addEventListener('click', () => {
    if(songList.length === 0) return;
    selectedSong = (selectedSong + 1) % songList.length;
    loadSong(selectedSong, isPlaying);
});

prevBtn.addEventListener('click', () => {
    if(songList.length === 0) return;
    selectedSong = (selectedSong - 1 + songList.length) % songList.length;
    loadSong(selectedSong, isPlaying);
});

// Repeat Logic
repeatBtn.addEventListener('click', () => {
    isRepeated = !isRepeated;
    repeatBtn.classList.toggle('text-green-500', isRepeated);
    repeatBtn.classList.toggle('text-gray-400', !isRepeated);
});

audio.addEventListener('ended', () => {
    if (isRepeated) audio.play();
    else nextBtn.click();
});

/**
 * 4. TIME & VOLUME UPDATES
 */
audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.style.width = `${pct}%`;
    
    const curM = Math.floor(audio.currentTime / 60);
    const curS = Math.floor(audio.currentTime % 60);
    document.getElementById('current-time').innerText = `${curM}:${curS < 10 ? '0'+curS : curS}`;
    
    if (audio.duration) {
        const durM = Math.floor(audio.duration / 60);
        const durS = Math.floor(audio.duration % 60);
        document.getElementById('duration').innerText = `${durM}:${durS < 10 ? '0'+durS : durS}`;
    }
});

timeline.addEventListener('click', (e) => {
    const bcr = timeline.getBoundingClientRect();
    const pct = (e.clientX - bcr.left) / bcr.width;
    audio.currentTime = pct * audio.duration;
});

volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    audio.volume = val / 100;
    volProgress.style.width = `${val}%`;
});

// Kick off the player with some fresh tracks
fetchMusic("New Phonk 2026", 200);
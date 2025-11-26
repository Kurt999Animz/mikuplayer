// ====== SCALE AND CENTER ======
function scaleAndCenter() {
    const $container = $('#container');
    const targetWidth = 1280, targetHeight = 720;
    const vw = $(window).width(), vh = $(window).height();
    const scale = Math.min(vw / targetWidth, vh / targetHeight);
    $container.css({
        'transform': `translate(-50%,-50%) scale(${scale})`,
        left: '50%',
        top: '50%'
    });
}
$(window).on('resize orientationchange', scaleAndCenter);
$(document).ready(scaleAndCenter);

// ====== GLOBAL VARIABLES ======
let bpm = 180, beatInterval = 60000 / bpm, halfBeat = beatInterval / 2, doubleBeat = beatInterval * 2;
let frameIndex = 0, frames = ["migu/001.png", "migu/002.png", "migu/003.png", "migu/004.png"];
let frameTimer = null, beatTimer = null, albumTimer = null;
let isPlaying = false;
const beatDelayCount = 16; // 16 beats delay
const loadingDuration = beatInterval * beatDelayCount;

// ====== SELECTORS ======
const $song = $('#song');
const $migu = $('#migu');
const $startMenu = $('#startMenu');
const $startBtn = $('#startBtn');
const $beatGradient = $('#beatGradient');
const $bgContainer = $('#bg-shape-container');
const $songPanel = $('#songPanel');
const $songItems = $('.songItem');
const $loadingScreen = $('#loadingScreen');
const $loadingFill = $('#loadingFill');
const $playPauseBtn = $('#playPauseBtn');
const $iconPause = $('#icon-pause');
const $iconPlay = $('#icon-play');
const $displayTitle = $('#displayTitle');
const $displayArtist = $('#displayArtist');
const $rotatingArt = $('#rotatingArt');
const $volumeSlider = $('#volumeSlider');
const $albumCont = $('.album-art-container');
const $header = $('header');
const $footer = $('footer');

// ====== INITIALIZE ======
let currentIndex = 0;
$songItems.eq(0).addClass("active");
updateFooterInfo($songItems.eq(0));

// ====== UPDATE FOOTER ======
function updateFooterInfo($item) {
    let title = $item.find("span").text().replace(/^\d+\.\s*/, '');
    $displayTitle.text(title);
    $displayArtist.text($item.data('artist') || "--");
}

// ====== PLAY SONG ======
function playSongAtIndex(index) {
    if (index < 0 || index >= $songItems.length) index = 0;
    currentIndex = index;

    const $item = $songItems.eq(index);
    frameIndex = 0;
    $migu.attr('src', frames[0]);

    // Stop any ongoing beat/frame animations immediately (like pause)
    stopTimers();
    isPlaying = false;
    updatePlayIcon();
    $bgContainer.css('opacity', '0.2');
    $beatGradient.css({ 'opacity': 0, 'bottom': '-300px' });

    $songItems.removeClass('active');
    $item.addClass('active');
    $item[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    bpm = parseInt($item.data('bpm')) || 180;
    beatInterval = 60000 / bpm;
    halfBeat = beatInterval / 2;
    doubleBeat = beatInterval * 2;

    updateFooterInfo($item);

    const audioEl = $song[0];
    audioEl.src = $item.data('file');
    audioEl.currentTime = 0;

    // Wait until audio is ready
    audioEl.addEventListener('canplay', function onCanPlay() {
        audioEl.removeEventListener('canplay', onCanPlay);

        // Play audio and start beat effects
        audioEl.play();
        isPlaying = true;
        updatePlayIcon();
        startBeatEffects();
        
    });
}
function initiateSong(index) {
    if (index < 0 || index >= $songItems.length) index = 0;
    currentIndex = index;

    const $item = $songItems.eq(index);
    frameIndex = 0;
    $migu.attr('src', frames[0]);

    // Stop any ongoing beat/frame animations immediately (like pause)
    stopTimers();
    isPlaying = false;
    updatePlayIcon();
    $bgContainer.css('opacity', '0.2');
    $beatGradient.css({ 'opacity': 0, 'bottom': '-300px' });

    $songItems.removeClass('active');
    $item.addClass('active');
    $item[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    bpm = parseInt($item.data('bpm')) || 180;
    beatInterval = 60000 / bpm;
    halfBeat = beatInterval / 2;
    doubleBeat = beatInterval * 2;

    updateFooterInfo($item);

    const audioEl = $song[0];
    audioEl.src = $item.data('file');
    audioEl.currentTime = 0;

    // Wait until audio is ready
    audioEl.addEventListener('canplay', function onCanPlay() {
        audioEl.removeEventListener('canplay', onCanPlay);

        // Play audio
        audioEl.play();
        isPlaying = true;
        updatePlayIcon();
    });
}


// ====== START BUTTON ======
$startBtn.on('click', function () {
    const firstSong = $songItems.eq(0);
    const audioEl = $song[0];
    audioEl.src = firstSong.data('file');
    audioEl.currentTime = 0;

    // Wait for audio to load fully
    audioEl.addEventListener('canplay', function onCanPlay() {
        audioEl.removeEventListener('canplay', onCanPlay);
        $startBtn.addClass("btn-exit");
    $startMenu.css('pointer-events', 'none');
    $loadingScreen.css('animation-play-state', 'running');


        // Animate loading fill
        $loadingFill.css('transition', `width ${loadingDuration / 1000}s linear`).css('width', '100%');
        $('#fallingImg').css('animation-play-state', 'running');

        // Play the first song and enable beat effects
        initiateSong(0);

        // Hide loader after 16 beats
        setTimeout(() => {
            startBeatEffects();
            $footer.css('transform', 'translateY(0)');
            $header.css('transform', 'translateY(0)');
            $startMenu.css('opacity', 0);
            $loadingScreen.css('opacity', 0);
            $migu.addClass('show');
            $songPanel.addClass('show');
        }, loadingDuration);
    });
});

// ====== CLICK SONG FROM LIST ======
$songItems.each(function (i) {
    $(this).on('click', function () {
        if (currentIndex === i && isPlaying) return;
        playSongAtIndex(i);
    });
});

// ====== CONTROLS ======
$playPauseBtn.on('click', function () {
    if (isPlaying) pauseAudio();
    else playAudio();
});

$volumeSlider.on('input', function () {
    $song[0].volume = this.value;
});

function playAudio() {
    const audioEl = $song[0];
    audioEl.play();
    isPlaying = true;
    updatePlayIcon();
    startBeatEffects();
}

function pauseAudio() {
    const audioEl = $song[0];
    audioEl.pause();
    isPlaying = false;
    updatePlayIcon();
    stopTimers();

    $bgContainer.css('opacity', '0.2');
    $beatGradient.css({ 'opacity': 0, 'bottom': '-300px' });
}

function updatePlayIcon() {
    $iconPlay.css('display', isPlaying ? 'none' : 'block');
    $iconPause.css('display', isPlaying ? 'block' : 'none');
}

// ====== SONG END ======
$song.on('ended', function () {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= $songItems.length) nextIndex = 0;
    playSongAtIndex(nextIndex);
});

// ====== BPM EFFECTS ======
function startBeatEffects() {
    stopTimers();

    frameTimer = setInterval(() => {
        frameIndex = (frameIndex + 1) % frames.length;
        $migu.attr('src', frames[frameIndex]);
    }, halfBeat);

    beatTimer = setInterval(() => {
        $beatGradient[0].animate(
            [
                { bottom: '0px', opacity: 0.8 },
                { bottom: '-300px', opacity: 0 }
            ],
            { duration: beatInterval, easing: 'ease-out' }
        );

        $bgContainer[0].animate(
            [
                { opacity: 0.9 },
                { opacity: 0.5 }
            ],
            { duration: beatInterval, easing: 'ease-out' }
        );
    }, beatInterval);

    albumTimer = setInterval(() => {
        $albumCont[0].animate(
            [
                { scale: '1.1' },
                { scale: '1' }
            ],
            { duration: doubleBeat, easing: 'ease-out' }
        );
    }, doubleBeat);
}

function stopTimers() {
    clearInterval(frameTimer);
    clearInterval(beatTimer);
    clearInterval(albumTimer);
}

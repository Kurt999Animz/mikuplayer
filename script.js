//to keep the htmml container scaled to specific ratio and centered
function scaleAndCenter() {
    const $container = $('#container');
    const targetWidth = 1280, targetHeight = 720;
    const vw = $(window).width(), vh = $(window).height();
    const scale = Math.min(vw/targetWidth, vh/targetHeight);
    $container.css({ 
        'transform': `translate(-50%,-50%) scale(${scale})`, 
        left: '50%', 
        top: '50%' 
    });
}
$(window).on('resize orientationchange', scaleAndCenter);
$(document).ready(scaleAndCenter);

//global variables 
let bpm=180, beatInterval=60000/bpm, halfBeat=beatInterval/2, doubleBeat=beatInterval*2;
let frameIndex=0, frames=["migu/001.png","migu/002.png","migu/003.png","migu/004.png"];
let frameTimer=null, beatTimer=null, albumTimer=null; 
let isPlaying = false;
const beatDelayCount = 16; // 16 beats delay
const loadingDuration = beatInterval * beatDelayCount;

//selectors
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
const $shapes = $('.background-shapes span');
const $albumCont = $('.album-art-container');
const $header = $('header');
const $footer = $('footer');

//Initialize (to make "be with you" the one playing first)
let currentIndex = 0;
$songItems.eq(0).addClass("active");
updateFooterInfo($songItems.eq(0));

//start button
// Start button
$startBtn.on('click', function() {

    // Initiate first song
    const $firstItem = $songItems.eq(0);
    $songItems.removeClass('active');
    $firstItem.addClass('active');

    const audioEl = $song[0];
    audioEl.src = $firstItem.data('file');
    audioEl.currentTime = 0;
    

    // Wait until audio is ready
    audioEl.addEventListener("canplay", function onCanPlay() {
        audioEl.removeEventListener("canplay", onCanPlay);


            $(this).addClass("btn-exit");
    $startMenu.css('pointer-events', 'none');
    $loadingScreen.css('animation-play-state', 'running');
    $loadingFill.css('transition', `width ${loadingDuration / 1000}s linear`).css('width', '100%');
    $('#fallingImg').css('animation-play-state', 'running');
        // Play audio
        audioEl.play();
        isPlaying = true;
        updatePlayIcon();

        // Start beat effects and reveal UI
        setTimeout(() => {
            $footer.css('transform', 'translateY(0)');
            $header.css('transform', 'translateY(0)');
            startBeatEffects();
            $startMenu.css('opacity', 0);
            $loadingScreen.css('opacity', 0);
            $migu.addClass('show');
            $songPanel.addClass('show');
        }, loadingDuration); // optional delay for 16-beat animation
    });
});


//i made this to initiate the first song and not have the bet effects until the  16th beat
function initiateSong(index) {
    if(index < 0 || index >= $songItems.length) index = 0; 
    currentIndex = index;
    const $item = $songItems.eq(index);
    
    $songItems.removeClass('active');
    $item.addClass('active');
    $item[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    bpm = parseInt($item.data('bpm'));
    beatInterval = 60000/bpm;
    halfBeat = beatInterval/2;
    doubleBeat = beatInterval*2;

    updateFooterInfo($item);

    const audioEl = $song[0];
    audioEl.src = $item.data('file');
    audioEl.currentTime = 0;

    // Wait until audio can play
    audioEl.addEventListener("canplay", function onCanPlay() {
        audioEl.removeEventListener("canplay", onCanPlay);

        // Start playback and animations
        audioEl.play();
        isPlaying = true;
        startBeatEffects();
        updatePlayIcon();
    });
}


//function to activate a song from the list
function activateSong(index) {
    if(index < 0 || index >= $songItems.length) index = 0; 
    currentIndex = index;
    const $item = $songItems.eq(index);
    frameIndex = 0;
    $migu.attr('src', frames[0]);

    $songItems.removeClass('active');
    $item.addClass('active');
    $item[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    bpm = parseInt($item.data('bpm'));
    beatInterval = 60000/bpm;
    halfBeat = beatInterval/2;
    doubleBeat = beatInterval*2;

    updateFooterInfo($item);

    $song.attr('src', $item.data('file'))[0].currentTime = 0;
    playAudio();
        const audioEl = $song[0];
    audioEl.src = $item.data('file');
    audioEl.currentTime = 0;

    // Wait until audio can play
    audioEl.addEventListener("canplay", function onCanPlay() {
        audioEl.removeEventListener("canplay", onCanPlay);

        // Start playback and animations
        audioEl.play();
        isPlaying = true;
        startBeatEffects();
        updatePlayIcon();
    });
}

function updateFooterInfo($item) {
    let title = $item.find("span").text().replace(/^\d+\.\s*/, '');
    $displayTitle.text(title);
    $displayArtist.text($item.data('artist') || "--");
}

//controls on footer
function playAudio() {
    $song[0].play();
    isPlaying = true;
    updatePlayIcon();
    startBeatEffects();
}

function pauseAudio() {
    $song[0].pause();
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

$playPauseBtn.on('click', function() {
    if(isPlaying) pauseAudio();
    else playAudio();
});

$volumeSlider.on('input', function() {
    $song[0].volume = this.value;
});

//song end -> play next song
$song.on('ended', function() {
    let nextIndex = currentIndex + 1;
    if(nextIndex >= $songItems.length) nextIndex = 0;
    activateSong(nextIndex);
});

//click on song from list
$songItems.each(function(index) {
    $(this).on('click', function() {
        if(currentIndex === index && isPlaying) return;
        activateSong(index);
    });
});

/* --- BPM EFFECTS --- */
//to make the beat effects sync to the music
//not jquery cuz its gon lag
function startBeatEffects() {
    stopTimers();

    frameTimer = setInterval(() => {
        frameIndex = (frameIndex + 1) % 4;
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




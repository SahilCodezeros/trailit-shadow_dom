import $ from 'jquery';

const chrome = window.chrome;

export const stopMediaPlaying = () => {
    console.log('in Stop media playing');
    if (document.URL.includes('https://edition.cnn.com')) {
        
        // Call select all videos function
        selectAllVideos(5000);
    } else if (
        document.URL.includes('https://abcnews.go.com/Video') ||
        document.URL.includes('https://www.ndtv.com/') || 
        document.URL.includes('https://www.bbc.com/')        
    ) {

        // Call select all videos function
        selectAllVideos(1);
    } else if (document.URL.includes('https://www.dailymotion.com/')) {
        setTimeout(() => {
            // Call select all videos function
            selectAllVideos(1);
        }, 2000);
    } else if (document.URL.includes('https://twitter.com/')) {
        setTimeout(() => {
            // Call select all videos function
            selectAllVideos(0);
        }, 4500);
    } else {

        // Call select all videos function
        selectAllVideos(0);
    }
};

// Select all videos of current website function
const selectAllVideos = (time) => {
    const videos = document.querySelectorAll('video');
    console.log('videos', videos);

    const audios = document.querySelectorAll('audio');
    console.log('audios', audios);

    chrome.storage.local.get(['AutoPlayMediaToggle'], (items) => {
        // For videos
        if (videos.length > 0) {
            videos.forEach(el => {
                // For Trailit videos
                if (el.className === 'preview-video' || el.className === 'tr_video') {

                    // Whether autoplay is defined or true
                    if (items && (items.AutoPlayMediaToggle || items.AutoPlayMediaToggle === undefined)) {
                        $(el).trigger('play');

                    // When autoplay is false
                    } else {
                        $(el).trigger('pause');
                    }
                
                // For other websites videos
                } else {
                    if (time === 0) {
                        // For suddenly loaded videos
                        console.log('hellooooooooo');
                        $(el).trigger('pause');
                    
                    } else if (time === 1) {
                        // For onlodeddata that not take time to play                    
                        el.onloadeddata = function () {
                            console.log('in el.onloadeddata');
                            $(el).trigger('pause');
                        };
                    } else {
                        // For time taken to load videos
                        el.onloadeddata = function() {
                            console.log('hiiiiiiiiiiiiiii');
                            setTimeout(() => {
                                $(el).trigger('pause');
                            }, time);                        
                        };
                    }
                }
            });
        }

        // For audios
        if (audios.length > 0) {
            audios.forEach(el => {
                el.onloadeddata = function () {
                    console.log('audio paused');

                    setTimeout(() => {
                        $(el).trigger('pause');
                    }, time);
                };
            });
        }
    }); 
};
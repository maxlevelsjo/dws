/**
 * LD Video Reels Enhanced - Instagram Stories Style
 * Matches design from https://github.com/machadomatt/slide-stories
 * Version: 2.0.0
 */

(function() {
    'use strict';

    // Check for jQuery or load it dynamically
    if (typeof jQuery === 'undefined') {
        var jqScript = document.createElement('script');
        jqScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
        jqScript.integrity = 'sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=';
        jqScript.crossOrigin = 'anonymous';
        jqScript.onload = initVideoReels;
        document.head.appendChild(jqScript);
    } else {
        initVideoReels();
    }

    function initVideoReels() {
        jQuery(document).ready(function($) {
            // Wait for window load to ensure all assets are ready
            $(window).on('load', function() {
                // Check if Flickity is available
                if (typeof Flickity === 'undefined') {
                    console.warn('Flickity not found. Loading dynamically...');
                    var flkScript = document.createElement('script');
                    flkScript.src = 'https://unpkg.com/flickity@2/dist/flickity.pkgd.min.js';
                    flkScript.onload = function() {
                        initializeAllReels($);
                    };
                    document.head.appendChild(flkScript);
                    return;
                }
                
                initializeAllReels($);
            });
        });
    }

    function initializeAllReels($) {
        $('.lqd-video-reels-container').each(function() {
            var $container = $(this);
            
            // Skip if already initialized
            if ($container.hasClass('initialized')) {
                return;
            }

            // Mark as initialized
            $container.addClass('initialized');

            var $items = $container.find('.lqd-video-reel-item');
            var $viewer = $container.find('.lqd-video-reels-viewer');
            var $progressContainer = $container.find('.lqd-video-reels-progress-container');
            var $progressBars = $container.find('.lqd-video-reel-progress');
            var $closeBtn = $container.find('.lqd-video-reels-close');
            var $videoContainer = $container.find('.lqd-video-reels-video-container');
            var $userInfo = $container.find('.lqd-video-reels-user-info');
            var currentIndex = 0;
            var progressInterval;
            var isPaused = false;
            var startTime;
            var remainingTime;

            // Create progress bars if they don't exist
            if ($progressBars.length === 0) {
                $progressContainer.empty();
                $items.each(function() {
                    $progressContainer.append('<div class="lqd-video-reel-progress"><div class="lqd-video-reel-progress-bar"></div></div>');
                });
                $progressBars = $container.find('.lqd-video-reel-progress');
            }

            // Initialize Flickity
            var flkty = new Flickity($container[0], {
                cellAlign: 'center',
                contain: true,
                pageDots: false,
                prevNextButtons: false,
                wrapAround: false,
                adaptiveHeight: true,
                draggable: false, // Disable dragging for stories-like behavior
                on: {
                    change: function(index) {
                        currentIndex = index;
                        loadCurrentItem();
                    }
                }
            });

            // Load first item
            loadCurrentItem();

            // Handle item click to open viewer
            $items.on('click', function(e) {
                e.preventDefault();
                currentIndex = $(this).index();
                openViewer();
            });

            // Close viewer handler
            $closeBtn.on('click', function(e) {
                e.stopPropagation();
                closeViewer();
            });

            // Handle keyboard events
            $(document).on('keydown.videoReels', function(e) {
                if (!$viewer.hasClass('is-active')) return;
                
                switch (e.keyCode) {
                    case 27: // ESC
                        closeViewer();
                        break;
                    case 37: // Left arrow
                        navigate('prev');
                        break;
                    case 39: // Right arrow
                        navigate('next');
                        break;
                }
            });

            // Touch events for mobile
            var touchStartX = 0;
            var touchEndX = 0;
            
            $viewer.on('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            });

            $viewer.on('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            });

            function handleSwipe() {
                if (touchStartX - touchEndX > 50) {
                    // Swipe left
                    navigate('next');
                } else if (touchEndX - touchStartX > 50) {
                    // Swipe right
                    navigate('prev');
                }
            }

            function openViewer() {
                $viewer.addClass('is-active');
                $('body').addClass('lqd-video-reels-viewer-open');
                flkty.select(currentIndex);
                loadCurrentItem();
                startProgress();
                $(document).on('keydown.videoReels', handleKeyboardNavigation);
            }

            function closeViewer() {
                $viewer.removeClass('is-active');
                $('body').removeClass('lqd-video-reels-viewer-open');
                pauseCurrentItem();
                resetProgress();
                $(document).off('keydown.videoReels');
            }

            function loadCurrentItem() {
                var $currentItem = $items.eq(currentIndex);
                var videoUrl = $currentItem.data('video-url');
                var isMuted = $currentItem.data('video-mute') === 'true';
                var duration = parseInt($currentItem.data('duration')) || 10000;
                var userName = $currentItem.data('user-name') || '';
                var userAvatar = $currentItem.data('user-avatar') || '';

                // Update user info
                $userInfo.find('.lqd-video-reels-username').text(userName);
                $userInfo.find('.lqd-video-reels-avatar').attr('src', userAvatar);

                // Load video
                $videoContainer.html('');
                var videoHtml = '';

                if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                    var videoId = getYouTubeId(videoUrl);
                    videoHtml = '<div class="lqd-video-reels-iframe-container">' +
                        '<iframe src="https://www.youtube.com/embed/' + videoId + 
                        '?autoplay=1&mute=' + (isMuted ? 1 : 0) + 
                        '&controls=0&loop=0&playsinline=1" frameborder="0" ' +
                        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>' +
                        '</div>';
                } 
                else if (videoUrl.includes('vimeo.com')) {
                    var videoId = getVimeoId(videoUrl);
                    videoHtml = '<div class="lqd-video-reels-iframe-container">' +
                        '<iframe src="https://player.vimeo.com/video/' + videoId + 
                        '?autoplay=1&muted=' + (isMuted ? 1 : 0) + 
                        '&loop=0&title=0&byline=0&portrait=0" frameborder="0" ' +
                        'allow="autoplay; fullscreen"></iframe>' +
                        '</div>';
                } 
                else {
                    // Self-hosted video
                    videoHtml = '<video autoplay ' + (isMuted ? 'muted' : '') + 
                        ' playsinline>' +
                        '<source src="' + videoUrl + '" type="video/mp4">' +
                        '</video>';
                }

                $videoContainer.html(videoHtml);
                remainingTime = duration;
            }

            function startProgress() {
                clearInterval(progressInterval);
                resetProgress();
                
                var $currentProgress = $progressBars.eq(currentIndex).find('.lqd-video-reel-progress-bar');
                var duration = parseInt($items.eq(currentIndex).data('duration')) || 10000;
                
                startTime = Date.now();
                isPaused = false;
                
                $currentProgress.css('transition', 'width ' + duration + 'ms linear');
                $currentProgress.css('width', '100%');
                
                progressInterval = setTimeout(function() {
                    navigate('next');
                }, duration);
            }

            function pauseProgress() {
                if (isPaused) return;
                
                var $currentProgress = $progressBars.eq(currentIndex).find('.lqd-video-reel-progress-bar');
                var computedWidth = parseFloat($currentProgress.css('width'));
                var progressPercent = computedWidth / $currentProgress.parent().width() * 100;
                
                remainingTime = remainingTime * (100 - progressPercent) / 100;
                
                $currentProgress.css('transition', 'none');
                $currentProgress.css('width', progressPercent + '%');
                
                clearTimeout(progressInterval);
                isPaused = true;
            }

            function resumeProgress() {
                if (!isPaused) return;
                
                var $currentProgress = $progressBars.eq(currentIndex).find('.lqd-video-reel-progress-bar');
                
                $currentProgress.css('transition', 'width ' + remainingTime + 'ms linear');
                $currentProgress.css('width', '100%');
                
                progressInterval = setTimeout(function() {
                    navigate('next');
                }, remainingTime);
                
                isPaused = false;
            }

            function resetProgress() {
                $progressBars.find('.lqd-video-reel-progress-bar').css({
                    'transition': 'none',
                    'width': '0%'
                });
                clearTimeout(progressInterval);
            }

            function navigate(direction) {
                if (direction === 'next') {
                    if (currentIndex < $items.length - 1) {
                        currentIndex++;
                        flkty.select(currentIndex);
                    } else {
                        closeViewer();
                        return;
                    }
                } else if (direction === 'prev') {
                    if (currentIndex > 0) {
                        currentIndex--;
                        flkty.select(currentIndex);
                    }
                }
                
                loadCurrentItem();
                startProgress();
            }

            function pauseCurrentItem() {
                var $video = $videoContainer.find('video, iframe');
                if (!$video.length) return;

                pauseProgress();
                
                if ($video.is('iframe')) {
                    var videoSrc = $video.attr('src');
                    $video.attr('src', videoSrc.replace('autoplay=1', 'autoplay=0'));
                } else {
                    $video[0].pause();
                }
            }

            function getYouTubeId(url) {
                var match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                return match ? match[1] : null;
            }

            function getVimeoId(url) {
                var match = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
                return match ? match[1] : null;
            }

            // Click events for progress navigation
            $progressBars.on('click', function(e) {
                e.stopPropagation();
                var clickedIndex = $(this).index();
                if (clickedIndex !== currentIndex) {
                    currentIndex = clickedIndex;
                    flkty.select(currentIndex);
                    loadCurrentItem();
                    startProgress();
                }
            });

            // Pause on hover
            $viewer.hover(
                function() { pauseProgress(); },
                function() { resumeProgress(); }
            );
        });
    }

    // Fallback for initialization
    setTimeout(function() {
        var containers = document.querySelectorAll('.lqd-video-reels-container:not(.initialized)');
        containers.forEach(function(container) {
            container.classList.add('flickity-fallback');
        });
    }, 3000);
})();
/**
 * Guest Pro — YouTube hero background (muted autoplay loop, no 30MB MP4).
 * Video: https://youtu.be/cdKx1Zv3YKs
 */
(function (global) {
	"use strict";

	var DEFAULT_VIDEO_ID = "cdKx1Zv3YKs";
	var apiQueue = [];

	function parseYoutubeVideoId(urlOrId) {
		var s = String(urlOrId || "").trim();
		if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
		var patterns = [
			/youtu\.be\/([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
			/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
		];
		for (var i = 0; i < patterns.length; i++) {
			var m = s.match(patterns[i]);
			if (m && m[1]) return m[1];
		}
		return null;
	}

	function getHeroYoutubeId() {
		var cfg = global.GUESTPRO_SITE || {};
		if (cfg.heroYoutubeVideoId) return cfg.heroYoutubeVideoId;
		if (cfg.heroYoutubeUrl) return parseYoutubeVideoId(cfg.heroYoutubeUrl);
		return DEFAULT_VIDEO_ID;
	}

	function ensureYoutubeApi(callback) {
		if (global.YT && global.YT.Player) {
			callback();
			return;
		}
		apiQueue.push(callback);
		if (global.__guestproYtApiLoading) return;
		global.__guestproYtApiLoading = true;
		global.onYouTubeIframeAPIReady = function () {
			var q = apiQueue.slice();
			apiQueue = [];
			q.forEach(function (fn) {
				try {
					fn();
				} catch (e) {}
			});
		};
		var tag = document.createElement("script");
		tag.src = "https://www.youtube.com/iframe_api";
		tag.async = true;
		var first = document.getElementsByTagName("script")[0];
		first.parentNode.insertBefore(tag, first);
	}

	function registerPlayer(player) {
		global.__guestproYoutubePlayers = global.__guestproYoutubePlayers || [];
		global.__guestproYoutubePlayers.push(player);
	}

	function initWrapper($wrapper, videoId) {
		if ($wrapper.attr("data-guestpro-yt-init") === "1") return;

		var $yt = $wrapper.find(".bgvid-youtube").first();
		var $mount = $yt.find(".bgvid-youtube-frame").first();
		if (!$mount.length) {
			$mount = $('<div class="bgvid-youtube-frame"></div>').appendTo($yt);
		}

		var mountId = $mount.attr("id");
		if (!mountId) {
			mountId = "guestpro-yt-" + Math.random().toString(36).slice(2, 11);
			$mount.attr("id", mountId);
		}

		ensureYoutubeApi(function () {
			var player = new global.YT.Player(mountId, {
				width: "100%",
				height: "100%",
				videoId: videoId,
				playerVars: {
					autoplay: 1,
					mute: 1,
					loop: 1,
					playlist: videoId,
					controls: 0,
					rel: 0,
					modestbranding: 1,
					playsinline: 1,
					enablejsapi: 1,
					iv_load_policy: 3,
					disablekb: 1,
					fs: 0,
					origin: global.location.origin,
				},
				events: {
					onReady: function (event) {
						try {
							event.target.mute();
							event.target.playVideo();
						} catch (e) {}
						$wrapper.addClass("guestpro-video-ready");
						$wrapper.attr("data-guestpro-yt-init", "1");
					},
					onStateChange: function (event) {
						if (event.data === global.YT.PlayerState.ENDED) {
							try {
								event.target.playVideo();
							} catch (e) {}
						}
					},
				},
			});
			registerPlayer(player);
		});

		/* Poster visible until player is ready */
		setTimeout(function () {
			$wrapper.addClass("guestpro-video-ready");
		}, 4000);
	}

	function guestProInitShowcaseHeroVideo() {
		var videoId = getHeroYoutubeId();
		if (!videoId) return;

		var $wrappers = $(".hero-video-wrapper.force-video");
		if ($wrappers.length === 0) return;

		$wrappers.each(function () {
			var $wrapper = $(this);
			if ($wrapper.find(".bgvid-youtube").length === 0) return;
			$wrapper.find("video.bgvid").remove();
			initWrapper($wrapper, videoId);
		});

		if (!global.__guestproVisibilityPlayBound) {
			global.__guestproVisibilityPlayBound = true;
			document.addEventListener(
				"visibilitychange",
				function () {
					if (document.visibilityState !== "visible") return;
					guestProResumeAllYoutubeHeroes();
				},
				{ passive: true },
			);
		}
	}

	function guestProPauseAllYoutubeHeroes() {
		(global.__guestproYoutubePlayers || []).forEach(function (player) {
			try {
				if (player && player.pauseVideo) player.pauseVideo();
			} catch (e) {}
		});
	}

	function guestProResumeAllYoutubeHeroes() {
		(global.__guestproYoutubePlayers || []).forEach(function (player) {
			try {
				if (player && player.playVideo) player.playVideo();
			} catch (e) {}
		});
	}

	global.guestProInitShowcaseHeroVideo = guestProInitShowcaseHeroVideo;
	global.guestProPauseAllYoutubeHeroes = guestProPauseAllYoutubeHeroes;
	global.guestProResumeAllYoutubeHeroes = guestProResumeAllYoutubeHeroes;
	global.guestProParseYoutubeVideoId = parseYoutubeVideoId;
})(window);

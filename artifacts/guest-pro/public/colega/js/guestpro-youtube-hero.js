/**
 * Guest Pro — YouTube hero background (direct embed, muted autoplay loop).
 * https://youtu.be/cdKx1Zv3YKs
 */
(function (global) {
	"use strict";

	var LOG = "[GuestPro:Hero]";
	var DEFAULT_VIDEO_ID = "cdKx1Zv3YKs";
	var refreshTimer = null;

	function heroLog(level, msg, detail) {
		var fn = console[level] || console.log;
		if (detail !== undefined) {
			fn.call(console, LOG, msg, detail);
		} else {
			fn.call(console, LOG, msg);
		}
	}

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

	function buildEmbedUrl(videoId, host) {
		var base =
			(host || "https://www.youtube.com") + "/embed/" + encodeURIComponent(videoId);
		var params = new URLSearchParams({
			autoplay: "1",
			mute: "1",
			loop: "1",
			playlist: videoId,
			controls: "0",
			rel: "0",
			modestbranding: "1",
			playsinline: "1",
			enablejsapi: "1",
			iv_load_policy: "3",
			disablekb: "1",
			fs: "0",
			origin: global.location.origin,
		});
		return base + "?" + params.toString();
	}

	function markReady($wrapper, reason) {
		$wrapper.addClass("guestpro-video-ready");
		$wrapper.attr("data-guestpro-yt-ready", reason || "unknown");
		heroLog("info", "video ready", { reason: reason });
	}

	function mountIframe($wrapper, videoId, host, attempt) {
		var $yt = $wrapper.find(".bgvid-youtube").first();
		var $iframe = $yt.find("iframe.bgvid-youtube-frame").first();

		if (!$iframe.length) {
			$iframe = $(
				'<iframe class="bgvid-youtube-frame" title="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" loading="eager"></iframe>',
			);
			$yt.append($iframe);
		}

		var url = buildEmbedUrl(videoId, host);
		var rect = $wrapper[0] && $wrapper[0].getBoundingClientRect();
		heroLog("info", "mount iframe", {
			attempt: attempt,
			host: host,
			videoId: videoId,
			size: rect ? { w: Math.round(rect.width), h: Math.round(rect.height) } : null,
			inIframe: global.self !== global.top,
		});

		var readyTimer = setTimeout(function () {
			if ($wrapper.attr("data-guestpro-yt-ready")) return;
			heroLog("warn", "iframe load timeout — showing layer anyway", { attempt: attempt });
			markReady($wrapper, "timeout");
		}, 8000);

		$iframe.off("load.guestpro error.guestpro");

		$iframe.on("load.guestpro", function () {
			clearTimeout(readyTimer);
			markReady($wrapper, "iframe-load");
		});

		$iframe.on("error.guestpro", function () {
			clearTimeout(readyTimer);
			heroLog("error", "iframe error event", { attempt: attempt, host: host });
			if (attempt === 1 && host.indexOf("nocookie") === -1) {
				heroLog("warn", "retrying with youtube-nocookie.com");
				mountIframe($wrapper, videoId, "https://www.youtube-nocookie.com", 2);
			} else {
				markReady($wrapper, "error-fallback-poster");
			}
		});

		$iframe.attr("src", url);
		$wrapper.attr("data-guestpro-yt-init", "1");
	}

	function wrapperNeedsInit($wrapper, videoId) {
		var $iframe = $wrapper.find("iframe.bgvid-youtube-frame").first();
		var src = $iframe.attr("src") || "";
		if ($wrapper.attr("data-guestpro-yt-init") === "1" && src.indexOf(videoId) !== -1) {
			return false;
		}
		return true;
	}

	function initWrapper($wrapper, videoId) {
		if (!wrapperNeedsInit($wrapper, videoId)) {
			heroLog("debug", "wrapper already mounted", { videoId: videoId });
			if (!$wrapper.hasClass("guestpro-video-ready")) {
				markReady($wrapper, "already-mounted");
			}
			return;
		}

		$wrapper.removeAttr("data-guestpro-yt-ready");
		$wrapper.removeClass("guestpro-video-ready");
		$wrapper.find("video.bgvid").remove();

		/* Mount immediately — CSS uses vw/vh cover; size may be 0 during AJAX/GSAP fade-in */
		mountIframe($wrapper, videoId, "https://www.youtube.com", 1);
	}

	function guestProInitShowcaseHeroVideo() {
		var videoId = getHeroYoutubeId();
		if (!videoId) {
			heroLog("error", "no YouTube video id in config");
			return;
		}

		var $wrappers = $(".hero-video-wrapper.force-video");
		heroLog("info", "init heroes", { count: $wrappers.length, videoId: videoId });

		if ($wrappers.length === 0) return;

		$wrappers.each(function (idx) {
			var $wrapper = $(this);
			if ($wrapper.find(".bgvid-youtube").length === 0) {
				heroLog("warn", "wrapper missing .bgvid-youtube", { index: idx });
				return;
			}
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

	function postToPlayers(command) {
		$(".bgvid-youtube-frame").each(function () {
			try {
				this.contentWindow &&
					this.contentWindow.postMessage(
						'{"event":"command","func":"' + command + '","args":""}',
						"*",
					);
			} catch (e) {}
		});
	}

	function guestProPauseAllYoutubeHeroes() {
		postToPlayers("pauseVideo");
	}

	function guestProResumeAllYoutubeHeroes() {
		postToPlayers("playVideo");
	}

	/** Re-run after Colega AJAX navigation — debounced, resets only empty wrappers. */
	function guestProRefreshHeroVideo() {
		if (refreshTimer) {
			clearTimeout(refreshTimer);
		}
		refreshTimer = setTimeout(function () {
			refreshTimer = null;
			heroLog("info", "refresh heroes (post-ajax)");

			$(".hero-video-wrapper.force-video").each(function () {
				var $w = $(this);
				var src = ($w.find("iframe.bgvid-youtube-frame").attr("src") || "").trim();
				if (!src) {
					$w.removeAttr("data-guestpro-yt-init data-guestpro-yt-ready");
					$w.removeClass("guestpro-video-ready");
				}
			});

			guestProInitShowcaseHeroVideo();
		}, 450);
	}

	global.guestProInitShowcaseHeroVideo = guestProInitShowcaseHeroVideo;
	global.guestProRefreshHeroVideo = guestProRefreshHeroVideo;
	global.guestProPauseAllYoutubeHeroes = guestProPauseAllYoutubeHeroes;
	global.guestProResumeAllYoutubeHeroes = guestProResumeAllYoutubeHeroes;
	global.guestProParseYoutubeVideoId = parseYoutubeVideoId;
	global.guestProHeroLog = heroLog;
})(window);

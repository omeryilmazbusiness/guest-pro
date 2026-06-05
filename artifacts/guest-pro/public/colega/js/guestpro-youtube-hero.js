/**
 * Guest Pro — YouTube hero background (direct embed, muted autoplay loop).
 * https://youtu.be/cdKx1Zv3YKs
 */
(function (global) {
	"use strict";

	var LOG = "[GuestPro:Hero]";
	var DEFAULT_VIDEO_ID = "cdKx1Zv3YKs";

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
		heroLog("info", "mount iframe", {
			attempt: attempt,
			host: host,
			videoId: videoId,
			url: url,
			inIframe: global.self !== global.top,
			origin: global.location.origin,
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
			} else if (attempt === 2) {
				markReady($wrapper, "error-fallback-poster");
			}
		});

		$iframe.attr("src", url);
		$wrapper.attr("data-guestpro-yt-init", "1");
	}

	function wrapperNeedsInit($wrapper, videoId) {
		var $iframe = $wrapper.find("iframe.bgvid-youtube-frame").first();
		var src = $iframe.attr("src") || "";
		if ($wrapper.attr("data-guestpro-yt-init") !== "1") return true;
		if (!src || src.indexOf(videoId) === -1) return true;
		if (!$wrapper.hasClass("guestpro-video-ready")) return true;
		return false;
	}

	function initWrapper($wrapper, videoId) {
		if (!wrapperNeedsInit($wrapper, videoId)) {
			heroLog("debug", "wrapper already playing", { videoId: videoId });
			return;
		}

		$wrapper.removeAttr("data-guestpro-yt-init data-guestpro-yt-ready");
		$wrapper.removeClass("guestpro-video-ready");

		$wrapper.find("video.bgvid").remove();

		var rect = $wrapper[0] && $wrapper[0].getBoundingClientRect();
		heroLog("info", "init wrapper", {
			videoId: videoId,
			size: rect ? { w: rect.width, h: rect.height } : null,
		});

		if (rect && (rect.width < 2 || rect.height < 2)) {
			heroLog("warn", "wrapper has zero size — defer init 300ms");
			setTimeout(function () {
				initWrapper($wrapper, videoId);
			}, 300);
			return;
		}

		mountIframe($wrapper, videoId, "https://www.youtube.com", 1);
	}

	function guestProInitShowcaseHeroVideo() {
		heroLog("info", "guestProInitShowcaseHeroVideo start");

		var videoId = getHeroYoutubeId();
		if (!videoId) {
			heroLog("error", "no YouTube video id in config");
			return;
		}

		var $wrappers = $(".hero-video-wrapper.force-video");
		heroLog("info", "found hero wrappers", { count: $wrappers.length, videoId: videoId });

		if ($wrappers.length === 0) {
			heroLog("warn", "no .hero-video-wrapper.force-video on page");
			return;
		}

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
					heroLog("debug", "visibilitychange", document.visibilityState);
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
			} catch (e) {
				heroLog("debug", "postMessage failed", e);
			}
		});
	}

	function guestProPauseAllYoutubeHeroes() {
		heroLog("debug", "pause all YouTube heroes");
		postToPlayers("pauseVideo");
	}

	function guestProResumeAllYoutubeHeroes() {
		heroLog("debug", "resume all YouTube heroes");
		postToPlayers("playVideo");
	}

	/** Re-run after Colega AJAX navigation (e.g. index → project01). */
	function guestProRefreshHeroVideo() {
		heroLog("info", "guestProRefreshHeroVideo (ajax/page swap)");
		global.__guestproYoutubePlayers = [];
		guestProInitShowcaseHeroVideo();
	}

	global.guestProInitShowcaseHeroVideo = guestProInitShowcaseHeroVideo;
	global.guestProRefreshHeroVideo = guestProRefreshHeroVideo;
	global.guestProPauseAllYoutubeHeroes = guestProPauseAllYoutubeHeroes;
	global.guestProResumeAllYoutubeHeroes = guestProResumeAllYoutubeHeroes;
	global.guestProParseYoutubeVideoId = parseYoutubeVideoId;
	global.guestProHeroLog = heroLog;
})(window);

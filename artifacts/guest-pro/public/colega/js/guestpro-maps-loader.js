/**
 * Load Google Maps only on pages with #map_canvas (contact page).
 * Uses loading=async per Google Maps JS API guidance.
 */
(function (global) {
	if (!document.getElementById("map_canvas")) return;

	var cfg = global.GUESTPRO_SITE || {};
	var key = cfg.googleMapsApiKey;
	if (!key) return;

	global.guestProOnGoogleMapsReady = function () {
		global.__guestProGoogleMapsReady = true;
		if (typeof global.guestProInitContactMap === "function") {
			global.guestProInitContactMap();
		}
	};

	var script = document.createElement("script");
	script.async = true;
	script.src =
		"https://maps.googleapis.com/maps/api/js?key=" +
		encodeURIComponent(key) +
		"&loading=async&callback=guestProOnGoogleMapsReady";
	document.head.appendChild(script);
})(window);

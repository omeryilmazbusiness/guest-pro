/**
 * Guest Pro — Colega template site config
 *
 * singleProjectMode: true  → Home shows only Guest Pro; Project 01 shows Let's Work Together CTA
 * singleProjectMode: false → Restore full template portfolio
 */
/** Base URL for colega assets (works in iframe + custom BASE_PATH). */
function guestProColegaBase() {
	var path = window.location.pathname || "/";
	var idx = path.indexOf("/colega/");
	if (idx >= 0) {
		return path.slice(0, idx + "/colega/".length);
	}
	return "/colega/";
}

window.GUESTPRO_SITE = window.GUESTPRO_SITE || {
	colegaBase: guestProColegaBase(),
	singleProjectMode: true,
	demoEmail: "omerfarukyilmazrbusiness@gmail.com",
	demoMailSubject: "Guest Pro — Demo Request",
	demoMailBody:
		"Hello Guest Pro Team,\n\n" +
		"I would like to request a demo of Guest Pro for our property.\n\n" +
		"Property / Organization:\n" +
		"Name:\n" +
		"Role:\n" +
		"Preferred contact method:\n\n" +
		"Thank you,\n" +
		"[Your name]",
	contactFormAction: "/api/public/contact",
	contactInboxEmail: "omerfarukyilmazrbusiness@gmail.com",
	contactDisplayEmail: "omerfarukyilmazrbusiness@gmail.com",
	/** Hero background — streamed from YouTube (no large MP4 download). */
	heroYoutubeVideoId: "cdKx1Zv3YKs",
	heroYoutubeUrl: "https://youtu.be/cdKx1Zv3YKs?si=EO_7wvCAhkexfe4n",
	marketingAboutPath: "/about",
	marketingContactPath: "/contact",
	googleMapsApiKey: "AIzaSyCpK1sWi3J3EbUOkF_K4-UHzi285HyFX5M",
};

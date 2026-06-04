/**
 * Guest Pro — Colega template site config
 *
 * singleProjectMode: true  → Home shows only Guest Pro; Project 01 shows Let's Work Together CTA
 * singleProjectMode: false → Restore full template portfolio
 */
window.GUESTPRO_SITE = window.GUESTPRO_SITE || {
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
};

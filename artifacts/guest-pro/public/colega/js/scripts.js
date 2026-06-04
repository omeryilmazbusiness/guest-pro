	/* Guest Pro site mode — see js/guestpro-config.js */
window.GUESTPRO_SITE = window.GUESTPRO_SITE || {
	colegaBase: (function () {
		var p = window.location.pathname || "/";
		var i = p.indexOf("/colega/");
		return i >= 0 ? p.slice(0, i + "/colega/".length) : "/colega/";
	})(),
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

function guestProColegaBase() {
	var cfg = window.GUESTPRO_SITE || {};
	if (cfg.colegaBase) {
		return String(cfg.colegaBase).replace(/\/?$/, "/");
	}
	var path = window.location.pathname || "/";
	var idx = path.indexOf("/colega/");
	if (idx >= 0) {
		return path.slice(0, idx + "/colega/".length);
	}
	return "/colega/";
}

function guestProAssetUrl(relativePath) {
	return guestProColegaBase() + String(relativePath || "").replace(/^\//, "");
}

function guestProIsSingleProjectMode() {
	return !!(window.GUESTPRO_SITE && window.GUESTPRO_SITE.singleProjectMode);
}

/** Home showcase background video — autoplay in iframe/production. */
function guestProInitShowcaseHeroVideo() {
	var $videos = $(".hero-video-wrapper.force-video video.bgvid");
	if ($videos.length === 0) return;

	$videos.each(function () {
		var video = this;
		var $source = $(video).find("source[type='video/mp4']").first();
		var rel =
			$source.attr("data-src") ||
			$source.attr("src") ||
			"videos/bauman.mp4";
		var url = guestProAssetUrl(rel);
		if ($source.attr("src") !== url) {
			$source.attr("src", url);
		}
		try {
			video.setAttribute("src", url);
		} catch (e) {}

		video.muted = true;
		video.defaultMuted = true;
		video.loop = true;
		video.playsInline = true;
		video.setAttribute("playsinline", "");
		video.setAttribute("webkit-playsinline", "");
		video.preload = "auto";

		var play = function () {
			if (!video) return;
			var p = video.play();
			if (p && typeof p.catch === "function") {
				p.catch(function () {});
			}
		};

		video.addEventListener("loadeddata", play, { passive: true });
		video.addEventListener("canplay", play, { passive: true });
		try {
			video.load();
		} catch (e) {}
		play();
	});

	document.addEventListener(
		"visibilitychange",
		function () {
			if (document.visibilityState === "visible") {
				$videos.each(function () {
					try {
						this.play();
					} catch (e) {}
				});
			}
		},
		{ passive: true },
	);
}

function applyGuestProSiteMode() {
	if (!guestProIsSingleProjectMode()) return;
	document.body.classList.add("guestpro-single-project-mode");
}

function configureShowcaseForSingleProject(swiperOptions) {
	if (!guestProIsSingleProjectMode()) return swiperOptions;
	swiperOptions.loop = false;
	swiperOptions.allowTouchMove = false;
	swiperOptions.mousewheel = false;
	swiperOptions.navigation = false;
	swiperOptions.pagination = false;
	return swiperOptions;
}

/** Move optional slides out of Swiper wrapper (kept in DOM for easy restore). */
function stashOptionalShowcaseSlides() {
	if (!guestProIsSingleProjectMode()) return;
	var $wrapper = $("#showcase-slider .swiper-wrapper");
	if (!$wrapper.length) return;
	var $stash = $("#guestpro-stashed-projects");
	if (!$stash.length) {
		$stash = $('<div id="guestpro-stashed-projects" class="guestpro-stashed-projects" aria-hidden="true"></div>');
		$("body").append($stash);
	}
	$wrapper.find(".guestpro-optional-project").appendTo($stash);
}

applyGuestProSiteMode();

function guestProBuildDemoMailto() {
	var cfg = window.GUESTPRO_SITE || {};
	var email = cfg.demoEmail || "omerfarukyilmazrbusiness@gmail.com";
	var params = new URLSearchParams();
	params.set("subject", cfg.demoMailSubject || "Guest Pro — Demo Request");
	params.set(
		"body",
		cfg.demoMailBody ||
			"Hello Guest Pro Team,\n\nI would like to request a demo of Guest Pro for our property.\n\nThank you,\n[Your name]"
	);
	return "mailto:" + email + "?" + params.toString();
}

/** Portfolio dropdown → Home; Buy Now → Get Demo mailto. */
function initGuestProNavAndDemo() {
	var mailto = guestProBuildDemoMailto();

	$("nav .flexnav > li").each(function () {
		var $li = $(this);
		var $span = $li.find('> a .before-span span[data-hover="Portfolio"]');
		if (!$span.length) return;
		$li.addClass("guestpro-portfolio-as-home");
		$li.find("> ul").remove();
		var $a = $li.find("> a").first();
		$a.attr("href", "index.html")
			.addClass("ajax-link")
			.attr("data-type", "page-transition");
		$span.attr("data-hover", "Home").text("Home");
	});

	$("nav .buy-item a").each(function () {
		var $a = $(this);
		$a.addClass("guestpro-get-demo")
			.attr("href", mailto)
			.removeAttr("target")
			.removeClass("ajax-link");
		$a.find("span[data-hover]").attr("data-hover", "Get Demo").text("Get Demo");
	});

	$(".guestpro-get-demo").each(function () {
		var $a = $(this);
		$a.attr("href", mailto)
			.removeClass("ajax-link ajax-link-project next-ajax-link-page")
			.removeAttr("data-type target");
	});
}

$(document).on("click", "a.guestpro-get-demo", function (e) {
	e.preventDefault();
	e.stopImmediatePropagation();
	window.location.href = guestProBuildDemoMailto();
	return false;
});

$(document).ready(function() {
	
	"use strict";
	applyGuestProSiteMode();
	initGuestProNavAndDemo();
	guestProInitShowcaseHeroVideo();
	
	// Guest Pro: keep background videos resilient (mobile + low power)
	(function KeepBackgroundVideoAlive() {
		var $vid = $('.hero-video-wrapper.force-video video.bgvid');
		if ($vid.length === 0) return;
		$vid.each(function () {
			var v = this;
			try {
				v.muted = true;
				v.loop = true;
				v.playsInline = true;
				// Kickstart playback and recover from stalls
				var kick = function () {
					if (!v || v.readyState === 0) return;
					var p = v.play();
					if (p && typeof p.catch === "function") p.catch(function () {});
				};
				["canplay", "canplaythrough", "stalled", "waiting", "suspend"].forEach(function (ev) {
					v.addEventListener(ev, kick, { passive: true });
				});
				v.addEventListener("error", function () {
					try { v.load(); } catch (e) {}
					kick();
				});
				// Capture a poster frame from the video and apply it to transition images.
				// This avoids showing the old static (reddish) placeholder during page transitions.
				var applyPosterOnce = function () {
					try {
						if (v.__guestproPosterApplied) return;
						if (v.readyState < 2) return; // need current data

						var canvas = document.createElement("canvas");
						var w = v.videoWidth || 0;
						var h = v.videoHeight || 0;
						if (!w || !h) return;
						canvas.width = w;
						canvas.height = h;
						var ctx = canvas.getContext("2d");
						if (!ctx) return;
						ctx.drawImage(v, 0, 0, w, h);
						var dataUrl = canvas.toDataURL("image/jpeg", 0.9);

						// Update nearest placeholder images (carousel/thumb transitions use these).
						var $wrapper = $(v).closest(".hero-video-wrapper");
						var $scope = $wrapper.closest(".section-image, #hero-bg-image, .img-mask, #hero-image-wrapper, .swiper-slide");
						$scope.find("img.item-image").each(function () {
							try { this.src = dataUrl; } catch (e) {}
						});
						$scope.find("img.grid__item-img--large").each(function () {
							try { this.src = dataUrl; } catch (e) {}
						});

						// If we're in project hero background, prefer setting background-image too.
						var $heroBg = $wrapper.closest("#hero-bg-image");
						if ($heroBg.length) {
							$heroBg.css("background-image", "url(" + dataUrl + ")");
						}

						// Update poster attribute for the background video itself.
						try { v.setAttribute("poster", dataUrl); } catch (e) {}

						v.__guestproPosterApplied = true;
					} catch (e) {}
				};

				// Seek to a stable frame (1s) once, then capture on seeked.
				if (!v.__guestproSeekedForPoster) {
					v.__guestproSeekedForPoster = true;
					v.addEventListener("seeked", applyPosterOnce, { passive: true });
					try {
						if (isFinite(v.duration) && v.duration > 2) v.currentTime = 1;
					} catch (e) {}
				}

				["canplay", "loadeddata"].forEach(function (ev) {
					v.addEventListener(ev, function () {
						applyPosterOnce();
					}, { passive: true });
				});

				kick();
			} catch (e) {
				// If the browser blocks autoplay, we silently fall back to poster image.
			}
		});
	})();

	stashOptionalShowcaseSlides();
	PageLoad();
	ScrollEffects();
	initGuestProEndorsementQuote();
	FirstLoad();
	Showcase();
	ShowcaseCarousel();
	Portfolio();
	FitThumbScreen();
	Shortcodes();	
	AjaxLoad();
	JustifiedGrid();
	Lightbox();
	Sliders();
	ContactForm();
	PlayVideo();
	ContactMap();
});



/*--------------------------------------------------
Function Page Load
---------------------------------------------------*/

	function PageLoad() {	
		
		if ($('#page-content').hasClass("light-content")) {
			$('.preloader-wrap').addClass('light-content');			
		}
		
		TweenMax.set($(".menu-timeline .before-span"), {y: 120, opacity:0});
		
		// Page Navigation Events
		$(".preloader-wrap").on('mouseenter', function() {	
			var $this = $(this);			
			TweenMax.to('#ball', 0.3,{borderWidth: '2px', scale: 1.2, borderColor:'#fff', backgroundColor:'#fff'});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
			$( "#ball" ).append( '<p class="first">' + $this.data("firstline") + '</p>' + '<p>' + $this.data("secondline") + '</p>' );				
		});
							
		$(".preloader-wrap").on('mouseleave', function() {					
			TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999', backgroundColor:'transparent'});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
			$('#ball p').remove();				
		});		
		
		$('body').removeClass('hidden').removeClass('hidden-ball');
		TweenMax.to($(".preloader-marquee-wrapper"), 1, {force3D:true, opacity:1, y: 0, delay:0.2, ease:Power3.easeOut});
		TweenMax.to($("#header-container"), 0.5, {force3D:true, opacity:1, delay:0.2, ease:Power2.easeOut}); //modified time
		var width = 100,
			perfData = window.performance.timing, 
			EstimatedTime = -(perfData.loadEventEnd - perfData.navigationStart),
			time = ((EstimatedTime/10)%550) * 10
			
		// Loadbar Animation
		$(".loadbar").animate({
			width: width + "%"
		}, time  );	
		
		
		// Percentage Increment Animation
		var PercentageID = $("#precent"),
				start = 0,
				end = 100,
				durataion = time + 0;
				animateValue(PercentageID, start, end, durataion);
				
		function animateValue(id, start, end, duration) {
		  
			var range = end - start,
			  current = start,
			  increment = end > start? 1 : -1,
			  stepTime = Math.abs(Math.floor(duration / range)),
			  obj = $(id);
			
			var timer = setInterval(function() {
				current += increment;
				$(obj).text(current);
			  //obj.innerHTML = current;
				if (current == end) {
					clearInterval(timer);
				}
			}, stepTime);
		}
		
		// Fading Out Loadbar on Finised
		setTimeout(function(){
			$('.loadbar').append('<span class="hold-progress-bar"></span>');
			
			TweenMax.to($('.hold-progress-bar'), 0.3, {force3D:true,width:'100%', delay:0, ease:Power2.easeOut, onComplete:function(){  //modified time 2019 nov
				
				$('body').waitForImages({
						finished: function() {
							TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999', backgroundColor:'transparent'});
							TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
							$('#ball p').remove();
							TweenMax.to($(" .trackbar, .percentage"),0.3, {force3D:true, opacity:0, y:-10, delay:0, ease:Power2.easeIn});
							TweenMax.to($(" .preloader-marquee"),0.5, {force3D:true, opacity:0, y:-40, delay:0.1, ease:Power2.easeIn});							
							TweenMax.to($(".preloader-wrap"),1, {force3D:true, yPercent: -101, delay:0.6, ease:Power2.easeInOut});
							TweenMax.set($(".preloader-wrap"), {visibility:'hidden', delay:1.7, opacity:0});
							TweenMax.to($("#header-container"), 0.5, {force3D:true, opacity:1, delay:1.4, ease:Power2.easeOut}); //modified time
							setTimeout(function(){
							
								$('body').waitForImages({
									finished: function() {
										TweenMax.to($(".header-middle, #footer-container, .showcase-counter, .swiper-pagination-bullet-active .counter"), 1, {force3D:true, opacity:1, delay:0, ease:Power2.easeOut}); 
												
									},
									waitForAll: true
								});
								
								if( $('.hero-video-wrapper').length > 0 ){
									$('#hero-image-wrapper').find('video').each(function() {
										$(this).get(0).play();
									});
									$('.hero-video-wrapper.force-video video.bgvid').each(function() {
										this.muted = true;
										var p = this.play();
										if (p && typeof p.catch === "function") p.catch(function () {});
									});
									guestProInitShowcaseHeroVideo();
								}
								
								TweenMax.to($("#main"), 0, {force3D:true, opacity:1, delay:0, ease:Power2.easeOut});//modified time
								if( $('#hero').hasClass("has-image")) {	
									TweenMax.to($("#hero-bg-image, #hero-fg-image"), 1, {force3D:true, scale:1.02 , opacity:1, delay:0.2, ease:Power2.easeOut});
									TweenMax.to($(".hero-title span"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.6, ease:Power2.easeOut});
									TweenMax.to($(".hero-subtitle"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:0.9, ease:Power2.easeOut});
									TweenMax.to($(".hero-footer-left"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:1.1, ease:Power2.easeOut});
									TweenMax.to($(".hero-footer-right"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:1.2, ease:Power2.easeOut});
									TweenMax.to($(".scroll-down-wrap"), 1, {force3D:true, scale:1, opacity:1, delay:1.2, ease: Elastic.easeOut});														
									TweenMax.to($("#main-page-content"), 0.4, {force3D:true, opacity:1, y:0, delay:1.15, ease:Power2.easeOut});
								} else {
									TweenMax.to($(".hero-title span"), 0.4, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.9, ease:Power2.easeOut});
									// Fading In Small Carousel elements on Finised
									var tlHerospan = new TimelineLite();
									tlHerospan.set($("#hero .hero-move-title span"), {y: 120, opacity:0});
									$("#hero .hero-move-title span").each(function(index, element) {
										tlHerospan.to(element, 0.7, {y:0, opacity:1, delay:0.6, ease:Power3.easeOut}, index * 0.1)
									});
									TweenMax.to($(".landing-caption"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.9, ease:Power2.easeOut});
									TweenMax.to($(".hero-subtitle"), 0.4, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.95, ease:Power2.easeOut});
									TweenMax.to($(".hero-footer-left"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:1, ease:Power2.easeOut});
									TweenMax.to($(".hero-footer-right"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:1.1, ease:Power2.easeOut});									
									TweenMax.to($("#main-page-content"), 0.7, {force3D:true, opacity:1, y:0, delay:1.3, ease:Power2.easeOut});				
								}	
								
								
								// Fading In Showcase elements on Finised
								TweenMax.set($("#showcase-slider-holder"), {opacity:0, scale:1.1});
								TweenMax.set($("#showcase-carousel-holder, #showcase-vertical-carousel-holder"), {opacity:0, scale:1.05});
								TweenMax.set($(".swiper-prev, .swiper-next, .swiper-pagination-bullet, .arrows-wrap, .carousel-allprojects-wrapper"), {opacity:0});								
								TweenMax.to($("#showcase-slider-holder, #showcase-carousel-holder, #showcase-vertical-carousel-holder"), 0.7, {force3D:true, opacity:1, scale:1, delay:0.6, ease:Power2.easeOut});
								TweenMax.to($(".swiper-slide-active .move-caption .move-title span"), 1, {force3D:true, y: 0, opacity:1, delay:0.8, ease:Power2.easeOut});
								TweenMax.to($(".swiper-slide-active .move-caption .subtitle span"), 0.7, {force3D:true, y: 0, opacity:1, delay:1.1, ease:Power2.easeOut});
								TweenMax.to($(".move-caption .move-title span"), 0.1, {force3D:true, y: 0, opacity:1, delay:2, ease:Power2.easeOut});
								TweenMax.to($(".move-caption .subtitle span"), 0.1, {force3D:true, y: 0, opacity:1, delay:2, ease:Power2.easeOut});
								TweenMax.to($(".swiper-prev"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:1.2, ease:Power2.easeOut});
								TweenMax.to($(".swiper-pagination-bullet, .arrows-wrap, .carousel-allprojects-wrapper"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:1, ease:Power2.easeOut});
								TweenMax.to($(".swiper-next"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:1.2, ease:Power2.easeOut});
								
								
								var slideWidth = $("#showcase-carousel-holder #showcase-slider .swiper-slide").width();
								TweenMax.set($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").prev(), {x:slideWidth, scale:0.8, opacity:0});
								TweenMax.set($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").next(), {x:-slideWidth, scale:0.8, opacity:0});								
								TweenMax.to($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").prev(), 2, {force3D:true, x:0, scale:1, delay:0.2, opacity:1, ease:Power3.easeInOut  });
								TweenMax.to($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").next(), 2, {force3D:true, x:0, scale:1, delay:0.2, opacity:1, ease:Power3.easeInOut  });
								
								
											
									
								setTimeout( function(){	
									$('body').removeClass("load-project-page").removeClass("load-project-page-carousel");
								} , 600 );
								
								setTimeout( function(){	
									$('body').removeClass("load-next-project");
									$('body').addClass("header-visible");
									$('#showcase-holder').removeClass("disabled");
								} , 1600 );
								
								setTimeout( function(){	
									$('body').removeClass("show-loader")
								} , 800 );	
								
							} , 600 );
						},
					waitForAll: true
				});
				
			}});
	  
		}, time);
		
		
		
	}// End Page Load


/*--------------------------------------------------
Function First Load
---------------------------------------------------*/	

	function FirstLoad() {	
		
		
		
		
		
		if ($("#page-content").hasClass("light-content")) {
			$("nav").css('background-color', '#141414');
			$("main, #main, #main-content").css('background-color', function () {
				return $("#page-content").data('bgcolor')
			});
			$('#magic-cursor').addClass('light-content');
			if( $('#hero').length > 0 ){						
				if( $('#hero').hasClass("has-image")) {	
					$("header").css('background-color', 'transparent');
				} else {
					$("header").css('background-color', 'transparent');
				}
			} else {
				$("header").css('background-color', 'transparent');
			}
		} else {			
			$("nav").css('background-color', '#141414');
			$("main, #main, #main-content").css('background-color', function () {
				return $("#page-content").data('bgcolor')
			});
			$('#magic-cursor').removeClass('light-content');
			if( $('#hero').length > 0 ){	
				if( $('#hero').hasClass("has-image")) {	
					$("header").css('background-color', 'transparent');
				} else {
					$("header").css('background-color', 'transparent');
				}
			} else {
				$("header").css('background-color', 'transparent');
			}
		}
		
		
		
		$('.video-cover').each(function() {
			var image = $(this).data('src');	
			$(this).css({'background-image': 'url(' + image + ')'});
		});
		
		//Load Default Page
		$('a.ajax-link').on('click', function() {
			$("body").addClass("show-loader");	
			$(".flexnav").removeClass("flexnav-show");
			$('#menu-burger').removeClass("open");
			$('header').removeClass('white-header');
			$("#app").remove();
			$(".big-title-caption").remove();	
			var tlMenu = new TimelineLite();
			$(".fullscreen-menu .menu-timeline").each(function(index, element) {
				tlMenu.to(element, 0.25, {y:-30, opacity:0, ease:Power2.easeIn}, index * 0.03)
			});	
			TweenMax.to('#ball', 0.3,{borderWidth:"4px",scale:0.5,backgroundColor:"rgba(0, 0, 0, 0)",opacity:1});			
			TweenMax.to($("#main, #hero-image-wrapper, #project-nav, .next-project-image, #app"), 0.3, {opacity:0, delay:0.1, ease:Power0.ease});					
			TweenMax.to($("#footer-container, .header-middle"), 0.3, {opacity:0, ease:Power0.ease});			
			TweenMax.to('#show-filters, #counter-wrap', 0.2,{opacity:0});
		});
		
		//Load Project from Showcase
		$('#showcase-slider-holder #showcase-slider-captions-stroked a.move-title').on('click', function() {	
			$('header').removeClass('white-header');
			TweenMax.to($(".swiper-prev"), 0.3, {force3D:true, opacity:0, delay:0, ease:Power2.easeOut});
			TweenMax.to($(".swiper-pagination .swiper-pagination-bullet"), 0.3, {force3D:true, opacity:0, delay:0.1, ease:Power2.easeOut});
			TweenMax.to($(".swiper-next"), 0.3, {force3D:true, opacity:0, delay:0.15, ease:Power2.easeOut});
			TweenMax.to('#ball', 0.3,{borderWidth:"4px",scale:0.5,backgroundColor:"rgba(0, 0, 0, 0)",opacity:1});
			$("body").addClass("load-project-page").addClass("show-loader");
		});
		
		
		//Load Page From Menu
		$('nav .ajax-link').on('click', function() {
			$(this).parents('.flexnav').addClass('hover');
			$(this).parents('.item-with-ul').addClass('hover');
			TweenMax.set($(this).find('span'),{yPercent:0});
			var tl = new TimelineLite();
			$(".menu-timeline .before-span").each(function(index, element) {
				tl.to(element, 0.5, {force3D:true, y:-120, opacity:0, delay:0, ease:Power2.easeIn}, index * 0.05)
			});
			$('header').removeClass('white-header');
			$("#app").remove();
			$(".big-title-caption").remove();	
		});
		
		
		
		$('#burger-wrapper, .menu .button-text').on('click', function() {
			$('#menu-burger, nav').toggleClass('open');			
			setTimeout( function(){			
				if ($('#menu-burger').hasClass("open")) {
					$('header').addClass('over-sidebar').addClass('over-white-section');
					if (!$('#page-content').hasClass("light-content")) {	
						$('#magic-cursor').addClass('light-content');
						$('#header-container').addClass('light-content');
					}
					TweenMax.set($("nav ul ul li"), {y: 0, opacity:1});
					//Fade In Navigation Lists
					var tlMenu = new TimelineLite();
					tlMenu.set($(".menu-timeline .before-span"), {y: 120, opacity:0});
					//TweenMax.staggerTo($(".menu-timeline"), 0,{cycle:{x: ["50", "-50"]}, opacity:0});
					$(".menu-timeline .before-span").each(function(index, element) {
						tlMenu.to(element, 0.7, {force3D:true, y:0, opacity:1, delay:0.4, ease:Power2.easeOut}, index * 0.1)
					});
					
						
				} else {	
					//Fade Out Navigation Lists	
					var tlMenu = new TimelineLite();					
					$(".menu-timeline .before-span").each(function(index, element) {
						tlMenu.to(element, 0.5, {force3D:true, y:-120, opacity:0, delay:0, ease:Power2.easeIn}, index * 0.05)
					});
					
					var tlSubMenu = new TimelineLite();					
					$("ul.flexnav-show li").each(function(index, element) {
						tlSubMenu.to(element, 0.5, {force3D:true, y:-120, opacity:0, delay:0, ease:Power2.easeIn}, index * 0.03)
					});
					
					if (!$('#page-content').hasClass("light-content")) {	
						setTimeout( function(){
							$('#magic-cursor').removeClass('light-content');
							$('#header-container').removeClass('light-content');
						} , 500 );
					}
					setTimeout( function(){
						$(".touch-button.active").trigger("click");
						$('header').removeClass('over-sidebar')
						setTimeout( function(){
							$('header').removeClass('over-white-section');
						} , 350 );
					} , 500 );
				}							
			} , 20 );
		});
		
		
		// Page Navigation Events
		$(".next-ajax-link-page").on('mouseenter', function() {	
			var $this = $(this);			
			TweenMax.to('#ball', 0.3,{borderWidth: '2px', scale: 1.2, borderColor:'#fff', backgroundColor:'#fff'});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
			$( "#ball" ).append( '<p class="first">' + $this.data("firstline") + '</p>' + '<p>' + $this.data("secondline") + '</p>' );				
		});
							
		$(".next-ajax-link-page").on('mouseleave', function() {					
			TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999', backgroundColor:'transparent'});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
			$('#ball p').remove();				
		});				
		
		
		$('.next-ajax-link-page').on('click', function() {					
			$("body").addClass("load-next-page");
			$("body").addClass("show-loader");
			$('header').removeClass('white-header');
			$("#app").remove();
			$(".big-title-caption").remove();	
				
			TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999', backgroundColor:'transparent'});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
			$("#ball").removeClass("with-icon");
			$('#ball p').remove();
			$('#ball i').remove();	
			
			if ($('#project-nav').hasClass("light-content")) {				
				setTimeout(function(){
					$('body').addClass('light-content');								
				} , 300 );
			}
			if ($("body").hasClass("smooth-scroll")) {
				var navmove = $("#content-scroll").height() - $("#page-nav").height() - $("footer").height() 			
			} else {
				var navmove = window.innerHeight - $("#hero").height() - $("footer").height() 		   
			}
			
			TweenMax.to($(".subtitle-info"), 0.3, {force3D:true, opacity:0, delay:0, y: -20, ease:Power2.easeOut});
			TweenMax.to($(".subtitle-name"), 0.3, {force3D:true, opacity:1, y: 0, delay:0.15, ease:Power2.easeOut});
			
			TweenMax.to($("#main-page-content, #hero"), 0.3, {opacity:0});		
			TweenMax.to($("#page-nav"), 0.7, {y: - navmove, delay:0, ease:Power2.easeInOut});
			TweenMax.to($("footer"), 0.3, {opacity:0, delay:0, ease:Power2.easeInOut});
		});
		
		
		// Project Navigation Events
		$("#project-nav .item-image").mouseenter(function(e) {	
			var $this = $(this);		
			TweenMax.to('#ball', 0.3,{borderWidth: '2px', scale: 1.2, borderColor:'#fff', backgroundColor:'#fff'});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
			$( "#ball" ).append( '<p class="first">' + $this.data("firstline") + '</p>' + '<p>' + $this.data("secondline") + '</p>' );
		});
						
		$("#project-nav .item-image").mouseleave(function(e) {
			TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999', backgroundColor:'transparent'});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
			$('#ball p').remove();
		});	
		
		$('.next-ajax-link-project').on('click', function() {					
			$("body").addClass("load-next-project").addClass("show-loader");
			$('header').removeClass('white-header');
			$("#app").remove();
			$(".big-title-caption").remove();	
					
			TweenMax.to('#ball', 0.3,{borderWidth:"4px",scale:0.5,backgroundColor:"rgba(0, 0, 0, 0)",opacity:1});
			if ($('#project-nav').hasClass("light-content")) {				
				setTimeout(function(){
					$('body').addClass('light-content');								
				} , 300 );
			}
			
			TweenMax.to($(".next-title"), 0.4, {force3D:true, opacity:0, delay:0, y: -20, rotation:3, ease:Power2.easeOut});						
			TweenMax.to($(".next-subtitle-name"), 0.4, {force3D:true, opacity:1, y: 0, rotation:0, delay:0.2, ease:Power2.easeOut});
			
			TweenMax.to($("#main-page-content"), 0.3, {opacity:0});			
			TweenMax.to($(".next-project-image"), 0.9, {scale:1.02, opacity: 1, ease:Power4.easeOut});
			TweenMax.to($(".next-project-image-bg"), 0.9, {scale:1, opacity: 1, ease:Power4.easeOut});
			TweenMax.to($(".next-project-image-fg"), 0.9, {scale:1, opacity: 1, ease:Power4.easeOut});
			TweenMax.to($("footer"), 0.3, {opacity:0, ease:Power2.easeInOut});
				
		});
		
		
		if( $('#project-nav').length > 0 ){
			$('#main-page-content').addClass('project-page');					
		}
		
		if( $('.portfolio').length > 0 ){
			$('#main-page-content').addClass('portfolio-page');			
		}
			
		
		
		
		var viewportWidth = $(window).width();
		if (viewportWidth < 1024) {				
			$('.hero-video-wrapper:not(.force-video)').remove();							 
		}
		
		
		
		
		
		
		
		
		
		
		
		
	}// End First Load
	
	

	
/*--------------------------------------------------
Function Lazy Load
---------------------------------------------------*/

	function LazyLoad() {	
		
		TweenMax.set($("#show-filters, #counter-wrap"), {opacity:0, delay:0});
		
		$('body').waitForImages({
			finished: function() {
				$('body').removeClass('loading')
				setTimeout( function(){	
					$('body').removeClass('hidden').removeClass('scale-up').removeClass('scale-none');
				} , 1500 );
			},
			waitForAll: true
		});	
		
		$('body').waitForImages({
			finished: function() {
				TweenMax.to($("#header-container, .header-middle"), 1, {force3D:true, opacity:1, ease:Power2.easeOut});				
			},
			waitForAll: true
		});
		
		TweenMax.to($("#main"), 0.3, {force3D:true, opacity:1, delay:0.1, ease:Power2.easeOut});
			
		
		if( $('#hero').hasClass("has-image")) {	
			if( $('body').hasClass("load-project-thumb-with-title")) {
				TweenMax.to($("#hero-fg-image, #hero-bg-image"), 0, {force3D:true, scale:1.02 , opacity:1, delay:0, ease:Power2.easeOut});				
				TweenMax.to($(".hero-title span"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.6, ease:Power2.easeOut});
				TweenMax.to($(".hero-subtitle"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:0.8, ease:Power2.easeOut});
				TweenMax.to($(".hero-footer-left"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.9, ease:Power2.easeOut});
				TweenMax.to($(".hero-footer-right"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:1, ease:Power2.easeOut});		
			} else if( $('body').hasClass("load-project-thumb")) {
				TweenMax.to($("#hero-fg-image, #hero-bg-image"), 0, {force3D:true, scale:1.02 , opacity:1, delay:0, ease:Power2.easeOut});				
				TweenMax.to($(".hero-title span"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.6, ease:Power2.easeOut});
				TweenMax.to($(".hero-subtitle"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:0.9, ease:Power2.easeOut});
				TweenMax.to($(".hero-footer-left"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:1.1, ease:Power2.easeOut});
				TweenMax.to($(".hero-footer-right"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:1.2, ease:Power2.easeOut});			
			}else {
				TweenMax.to($("#hero-fg-image, #hero-bg-image"), 0, {force3D:true, scale:1.02 , opacity:1, delay:0, ease:Power2.easeOut});
				TweenMax.to($(".hero-title span"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.7, ease:Power2.easeOut});
				TweenMax.to($(".hero-subtitle"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:0.6, ease:Power2.easeOut});
				TweenMax.to($(".hero-footer-left"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.9, ease:Power2.easeOut});
				TweenMax.to($(".hero-footer-right"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:1, ease:Power2.easeOut});	
			}
			TweenMax.to($("#main-page-content"), 0.4, {force3D:true, opacity:1, y:0, delay:0.95, ease:Power2.easeOut});
		} else {
			TweenMax.to($(".hero-title"), 0.4, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.1, ease:Power2.easeOut});
			var tlHerospan = new TimelineLite();
			tlHerospan.set($("#hero .hero-move-title span"), {y: 120, opacity:0});
			$("#hero .hero-move-title span").each(function(index, element) {
				tlHerospan.to(element, 0.7, {y:0, opacity:1, delay:0, ease:Power3.easeOut}, index * 0.1)
			});
			TweenMax.to($(".landing-caption"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.4, ease:Power2.easeOut});
			TweenMax.to($(".hero-subtitle"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.15, ease:Power2.easeOut});
			TweenMax.to($(".hero-footer-left"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:0.5, ease:Power2.easeOut});
			TweenMax.to($(".hero-footer-right"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:0.6, ease:Power2.easeOut});
			TweenMax.to($("#main-page-content"), 0.2, {force3D:true, opacity:1, delay:0.15, ease:Power2.easeOut});
		}	
		
		// Fading In Showcase elements on Finised
		TweenMax.set($("#showcase-slider-holder"), {opacity:0, scale:1.1});
		TweenMax.set($("#showcase-carousel-holder, #showcase-vertical-carousel-holder"), {opacity:0, scale:1.1});
		TweenMax.set($(".swiper-prev, .swiper-next, .swiper-pagination-bullet, .arrows-wrap, .carousel-allprojects-wrapper"), {opacity:0});								
		TweenMax.to($("#showcase-slider-holder, #showcase-carousel-holder, #showcase-vertical-carousel-holder"), 0.4, {force3D:true, opacity:1, scale:1, delay:0.6, ease:Power2.easeOut});
		TweenMax.to($(".swiper-slide-active .move-caption .move-title span"), 1, {force3D:true, y: 0, opacity:1, delay:0.9, ease:Power2.easeOut});
		TweenMax.to($(".swiper-slide-active .move-caption .subtitle span"), 0.7, {force3D:true, y: 0, opacity:1, delay:1.3, ease:Power2.easeOut});
		TweenMax.to($(".move-caption .move-title span"), 0.1, {force3D:true, y: 0, opacity:1, delay:2, ease:Power2.easeOut});
		TweenMax.to($(".move-caption .subtitle span"), 0.1, {force3D:true, y: 0, opacity:1, delay:2, ease:Power2.easeOut});
		TweenMax.to($(".swiper-prev"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:1.2, ease:Power2.easeOut});
		TweenMax.to($(".swiper-pagination-bullet, .arrows-wrap, .carousel-allprojects-wrapper"), 0.7, {force3D:true, y:0, opacity:1, rotation:0, delay:1.1, ease:Power2.easeOut});
		TweenMax.to($(".swiper-next"), 0.7, {force3D:true, y: 0, opacity:1, rotation:0, delay:1.2, ease:Power2.easeOut});
		
		var slideWidth = $("#showcase-carousel-holder #showcase-slider .swiper-slide").width();
		TweenMax.set($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").prev(), {x:slideWidth, scale:0.8, opacity:0});
		TweenMax.set($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").next(), {x:-slideWidth, scale:0.8, opacity:0});								
		TweenMax.to($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").prev(), 2.5, {force3D:true, x:0, scale:1, delay:0, opacity:1, ease:Power3.easeInOut  });
		TweenMax.to($("#showcase-carousel-holder #showcase-slider .swiper-slide-active").next(), 2.5, {force3D:true, x:0, scale:1, delay:0, opacity:1, ease:Power3.easeInOut  });
		
		
		
		TweenMax.to($("#footer-container"), 1, {force3D:true, opacity:1, delay:0.4, ease:Power2.easeOut});		
		
		if( $('.load-project-thumb').length > 0 ){
			setTimeout( function(){
				$('#hero-image-wrapper').find('video').each(function() {
					$(this).get(0).play();
				});
				$("#app.active").remove();
				$(".big-title-caption").remove();	
			} , 250 );
		} else if( $('.load-project-thumb-with-title').length > 0 ){
			setTimeout( function(){
				$('#hero-image-wrapper').find('video').each(function() {
					$(this).get(0).play();
				});
				$("#app.active").remove();
				$(".big-title-caption").remove();	
			} , 250 );
		} else {
			$('#hero-image-wrapper').find('video').each(function() {
				$(this).get(0).play();
			});
		}
		
		setTimeout( function(){	
			$('header').removeClass('white-header');
			$('body').removeClass("load-project-page").removeClass("load-project-thumb").removeClass("load-next-project").removeClass("load-next-page");
			setTimeout( function(){	
				$('body').removeClass("load-project-thumb-with-title").removeClass("show-loader");
			} , 300 );
			
		} , 500 );
		
	
	}// End Lazy Load		



/*--------------------------------------------------
Function Showcase Slider
---------------------------------------------------*/
	
	function Showcase() {
		
	
		if( $('#showcase-slider-holder').length > 0 ){
			
			$("footer").addClass("showcase-footer");
								
			var interleaveOffset = 0.5;
			
			var swiperOptions = configureShowcaseForSingleProject({
				direction: "horizontal",
				loop: true,
				grabCursor: false,
				resistance : true,
				resistanceRatio:0.5,
				slidesPerView: 1,
				allowTouchMove:true,  
				speed:1000,
				autoplay: false,
				mousewheel: true,
				parallax:true,
				navigation: {
					nextEl: '.swiper-next',
					prevEl: '.swiper-prev',
				},
				pagination: {
				  el: '.swiper-pagination',
						clickable: true,
						renderBullet: function (index, className) {
					  return '<span class="' + className + '">'+'<div class="parallax-wrap">' + '<div class="parallax-element">' + '<svg class="fp-arc-loader" width="20" height="20" viewBox="0 0 20 20">'+
									'<circle class="path" cx="10" cy="10" r="5.5" fill="none" transform="rotate(-90 10 10)" stroke="#FFF"'+
									'stroke-opacity="1" stroke-width="2px"></circle>'+
							'<circle cx="10" cy="10" r="3" fill="#FFF"></circle>'+
									'</svg></div></div></span>';
					},
			
				},						
				on: {
					progress: function() {
						var swiper = this;
						for (var i = 0; i < swiper.slides.length; i++) {
							var slideProgress = swiper.slides[i].progress;
							var innerOffset = swiper.width * interleaveOffset;
							var innerTranslate = slideProgress * innerOffset;
							swiper.slides[i].querySelector(".img-mask").style.transform = "translate3d(" + innerTranslate + "px,0, 0)";
						}
					  
					},
					touchStart: function() {
						var swiper = this;
						for (var i = 0; i < swiper.slides.length; i++) {
							swiper.slides[i].style.transition = "";
						}
					},
					setTransition: function(speed) {
						var swiper = this;
						for (var i = 0; i < swiper.slides.length; i++) {
							swiper.slides[i].style.transition = speed + "ms";
							swiper.slides[i].querySelector(".img-mask").style.transition = speed + "ms";
						}   
				 	},
					init: function () {						
						$('.swiper-slide-active').find('video').each(function() {
							$(this).get(0).play();
						});
						
					},
					slideChangeTransitionStart: function () {
						
						$('.swiper-slide-active').find('video').each(function() {
							$(this).get(0).play();
						}); 				
						
					},				
					slideChangeTransitionEnd: function () {	
						
						$('.swiper-slide-prev').find('video').each(function() {
							$(this).get(0).pause();
						});
						
						$('.swiper-slide-next').find('video').each(function() {
							$(this).get(0).pause();
						});
						
					},
  				},
			});
							
			var showcaseSwiper = new Swiper("#showcase-slider", swiperOptions);
			if (guestProIsSingleProjectMode()) {
				showcaseSwiper.slideTo(0, 0);
				try { showcaseSwiper.update(); } catch (e) {}
			}
			
			
			
			if ($(window).width() >= 1024) {
			
				$('#showcase-slider-holder .stroked .move-title').on('mousedown', function(event) {
					return false;
				});				
				
				$('#showcase-slider-holder').on('mousedown touchstart', function() {	
					TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
					$("body" ).addClass("scale-drag");
				});
					
				$('#showcase-slider-holder').on('mouseup touchend', function() {
					TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
					$("body").removeClass("scale-drag").removeClass("drag-cursor");
				});
				
				$('body').on('mouseup touchend', function() {				
					$('body').removeClass('scale-drag');					
				});
				
				$("#showcase-slider-holder .stroked .move-title").mouseenter(function(e) {	
					var $this = $(this);		
					TweenMax.to('#ball', 0.3,{borderWidth: '2px', scale: 1.2, borderColor:'#fff', backgroundColor:'#fff'});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
					$( "#ball" ).append( '<p class="first">' + $this.data("firstline") + '</p>' + '<p>' + $this.data("secondline") + '</p>' );
				});
								
				$("#showcase-slider-holder .stroked .move-title").mouseleave(function(e) {
					TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999', backgroundColor:'transparent'});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
					$('#ball p').remove();
				});	
			
			}
			
			
		}	
		
			
	}//End Showcase Slider
	
	
	
/*--------------------------------------------------
Function Showcase Carousel
---------------------------------------------------*/
	
	function ShowcaseCarousel() {
		
	
		if( $('#showcase-carousel-holder').length > 0 ){	
								
			$("footer").addClass("showcase-footer")
			
			var showcaseSwiper = new Swiper('#showcase-slider', {
				direction: "horizontal",
				loop: true,
				grabCursor: false,
				resistance : true,
				resistanceRatio:0.5,
				slidesPerView: 'auto',
				allowTouchMove:true,  
				speed:1000,
				autoplay: false,
				mousewheel: true,
				centeredSlides: true,
				spaceBetween: 0,
				navigation: {
					nextEl: '.swiper-next',
					prevEl: '.swiper-prev',
				},
				pagination: {
				  el: '.swiper-pagination',
						clickable: true,
						renderBullet: function (index, className) {
					  return '<span class="' + className + '">'+'<div class="parallax-wrap">' + '<div class="parallax-element">' + '<svg class="fp-arc-loader" width="20" height="20" viewBox="0 0 20 20">'+
									'<circle class="path" cx="10" cy="10" r="5.5" fill="none" transform="rotate(-90 10 10)" stroke="#FFF"'+
									'stroke-opacity="1" stroke-width="2px"></circle>'+
							'<circle cx="10" cy="10" r="3" fill="#FFF"></circle>'+
									'</svg></div></div></span>';
					},
			
				},						
				on: {
					
					init: function () {						
						$('.swiper-slide-active').find('video').each(function() {
							$(this).get(0).play();
						});
					},				
					slideNextTransitionStart: function () {	
						
						var tl = new TimelineLite();
						
						$('.swiper-pagination-bullet-active').prev().find('.counter').each(function(index, element) {
							tl.to(element, 0.3, {scale:1, y:-20, opacity:0, ease:Power2.easeIn}, index * 0.01)
						});
						
						$('.swiper-pagination-bullet-active').find('.counter').each(function(index, element) {
							tl.to(element, 0.4, {scale:1, y:0, opacity:1, scale:1, delay:0.3, ease:Power2.easeOut}, index * 0.01)
						});
						
						$('.swiper-pagination-bullet-active').next().find('.counter').each(function(index, element) {
							tl.to(element, 0.3, {scale:1, y:20, opacity:0, ease:Power2.easeIn}, index * 0.01)
						});						
						
					},
					slidePrevTransitionStart: function () {	
						
						var tl = new TimelineLite();
						
						$('.swiper-pagination-bullet-active').prev().find('.counter').each(function(index, element) {
							tl.to(element, 0.3, {scale:1, y:-20, opacity:0, delay:0.1,  ease:Power2.easeIn}, index * 0.01)
						});
						
						$('.swiper-pagination-bullet-active').find('.counter').each(function(index, element) {
							tl.to(element, 0.4, {scale:1, y:0, opacity:1, scale:1, delay:0.45, ease:Power2.easeOut}, index * 0.01)
						});
						
						$('.swiper-pagination-bullet-active').next().find('.counter').each(function(index, element) {
							tl.to(element, 0.3, {scale:1, y:20, opacity:0, delay:0.1,  ease:Power2.easeIn}, index * 0.01)
						});					
						
					},
					slideChangeTransitionStart: function () {
						
						$('.swiper-button-white').addClass('disable-click');
						
						$('.swiper-slide-active').find('video').each(function() {
							$(this).get(0).play();
						}); 					
						
					},				
					slideChangeTransitionEnd: function () {	
						
						$('.swiper-button-white').removeClass('disable-click');
						
						$('.swiper-slide-prev').find('video').each(function() {
							$(this).get(0).pause();
						});
						
						$('.swiper-slide-next').find('video').each(function() {
							$(this).get(0).pause();
						});
						
					}
  				},
			});
			
			
			
			
			
			if ($(window).width() >= 1024) {
			
				$('#showcase-carousel-holder .stroked .move-title').on('mousedown', function(event) {
					return false;
				});	
				
							
				
				$('#showcase-carousel-holder').on('mousedown touchstart', function() {	
					TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
					$("body" ).addClass("scale-drag");
				});
					
				$('#showcase-carousel-holder').on('mouseup touchend', function() {
					TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
					$("body").removeClass("scale-drag").removeClass("drag-cursor");
				});
				
				$('body').on('mouseup touchend', function() {				
					$('body').removeClass('scale-drag');					
				});
				
				$("#showcase-carousel-holder .stroked .move-title").mouseenter(function(e) {	
					var $this = $(this);		
					TweenMax.to('#ball', 0.3,{borderWidth: '2px', scale: 1.2, borderColor:'#fff', backgroundColor:'#fff'});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
					$( "#ball" ).append( '<p class="first">' + $this.data("firstline") + '</p>' + '<p>' + $this.data("secondline") + '</p>' );
				});
								
				$("#showcase-carousel-holder .stroked .move-title").mouseleave(function(e) {
					TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999', backgroundColor:'transparent'});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
					$('#ball p').remove();
				});	
				
			
			}
			
			
		}	
		
			
	}//End Showcase Carousel
	
	
	
	

	


/*--------------------------------------------------
Function Portfolio
---------------------------------------------------*/	
		
	function Portfolio() {	
	
			
		if( $('.portfolio-wrap').length > 0 ){			
			
			
			if ($("body").hasClass("smooth-scroll")) {
				var elem = document.querySelector("#content-scroll");
				var scrollbar = Scrollbar.init(elem,
				{
					renderByPixels: true,
					damping:0.05
				});
			}
			
			var $container = $('.portfolio');
		
			$container.isotope({
			  layoutMode: 'packery',
			  itemSelector: '.item',
			  gutter:0,
			  transitionDuration: "0.5s"
			});
			
			$('#filters a').on('click', function() {
				$('#filters a').removeClass('active');
				$(this).addClass('active');
				$('.item').addClass('item-margins');
				var selector = $(this).attr('data-filter');
				$container.isotope({ filter: selector }, function( $changedItems, instance ) {
				  instance.$allAtoms.filter('.isotope-hidden').removeClass('is-filtered');
				  instance.$filteredAtoms.addClass('is-filtered');
				});		
				return false;
			});
			
			$("#all").trigger('click');
				
			$('.item').each(function() {
				var image = $(this).find('.item-image').data('src');	
				$(this).find('.item-image').css({'background-image': 'url(' + image + ')'});
			});
			
			
			$(".item-image").mouseenter(function(e) {	
				TweenMax.to('#ball', 0.3,{borderWidth: '2px', scale: 1, borderColor:'#fff'});
				TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
				$( "#ball" ).addClass("with-icon").append( '<i class="fa fa-plus"></i>' );
				$(this).parent().find('video').each(function() {
					$(this).get(0).play();
				});
			});
							
			$(".item-image").mouseleave(function(e) {
				TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999'});
				TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
				$("#ball").removeClass("with-icon");
				$('#ball i').remove();
				$(this).parent().find('video').each(function() {
					$(this).get(0).pause();
				});
			});			
			
			
			//Show Filters On overlay
			$('#show-filters, #close-filters').on('click', function() {			
				$('#filters-overlay').toggleClass('active');
				var navtitleheight = $(".hero-title").height()
				var navsubtitleheight = $(".hero-subtitle").height()
				
				setTimeout( function(){			
					if ($('#filters-overlay').hasClass("active")) {
						
						TweenMax.to($(".item-parallax"), 0.6, {force3D:true, scale:0.9, opacity:0.3, delay:1.1, ease:Power2.easeInOut});					
						TweenMax.to($(".active .item-caption"), 0.3, {opacity:0, ease:Power2.easeOut});
						TweenMax.to($("#show-filters, #counter-wrap"), 0.3, {opacity:0, delay:0, ease:Power2.easeOut});
						TweenMax.to($("#show-filters, #counter-wrap"), 0, {visibility:'hidden', delay:0.35, ease:Power2.easeOut}); 
						
						//Fade In Navigation Lists
						TweenMax.set($(".filters-info"), {y:30, opacity:0});
						TweenMax.to($(".filters-info"), 0.4, {force3D:true, y:0, opacity:1, delay:0.7, ease:Power2.easeOut});
						var tlMenu = new TimelineLite();
						tlMenu.set($(".filters-timeline"), {y:60, opacity:0});
						$(".filters-timeline").each(function(index, element) {
							tlMenu.to(element, 0.5, {y:0, opacity:1, delay:1.2, ease:Power3.easeOut}, index * 0.1)
						});
						
						var heroheight = $("#hero").height();			
						if ($("body").hasClass("smooth-scroll")) {
							TweenLite.to(scrollbar, 1.5, {scrollTop:heroheight, ease:Power4.easeInOut});
						} else {
							$("html,body").animate({scrollTop: heroheight}, 800);
						}
							
					} else {					
						
						
						TweenMax.to($(".item-parallax"), 0.6, {force3D:true, scale: 1, opacity:1, delay:0.3, ease:Power2.easeInOut});					
						TweenMax.to($(".active .item-caption"), 0.5, {opacity:1, delay:0.5, ease:Power2.easeOut});
						TweenMax.set($("#show-filters, #counter-wrap"), {visibility:'visible', opacity:0});
						TweenMax.to($("#show-filters, #counter-wrap"), 0.3, {opacity:1, delay:0.7, ease:Power2.easeOut});
						
						//Fade Out Navigation Lists
						TweenMax.to($(".filters-info"), 0.2, {force3D:true, y:-30, opacity:0, delay:0, ease:Power1.easeIn});					
						var tlMenu = new TimelineLite();
						$(".filters-timeline, .jssocials-share").each(function(index, element) {
							tlMenu.to(element, 0.25, {opacity:0, y:-60, delay:0.1, ease:Power1.easeIn }, index * 0.1)
						});	
						TweenMax.to('#ball', 0.1,{borderWidth: '4px', scale:0.5,});
						$("#ball").removeClass("close-icon");
						$('#ball i').remove();
						
					}							
				} , 20 );
			});
			
			
			$("#close-filters").mouseenter(function(e) {	
				TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
				TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
				$( "#ball" ).addClass("close-icon").append( '<i class="fa fa-times"></i>' );
			});
				
			$("#close-filters").mouseleave(function(e) {
				TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
				TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
				$("#ball").removeClass("close-icon");
				$('#ball i').remove();
			});
			
			
			
			
			setTimeout( function(){
				var controller = new ScrollMagic.Controller();
				$('.portfolio').each(function(){
					var $this = $(this);
					var $elheight = window.innerHeight*0.7;
					var $thisHeight = $(this).outerHeight() - $elheight;
					
					var scene = new ScrollMagic.Scene({triggerElement:$this[0],duration: $thisHeight})
						.addTo(controller)
						
					
					scene.triggerHook(0.3)
					
					scene.on('enter', function(){				
						TweenMax.to($("#show-filters"), 0.3, {opacity:1, delay:0, ease:Power2.easeOut});
						$("#show-filters").addClass('enabled')
					});
					
					scene.on('leave', function(){				
						TweenMax.to($("#show-filters"), 0.15, {opacity:0, delay:0, ease:Power2.easeOut});
						$("#show-filters").removeClass('enabled')
					});
					
					if ($("body").hasClass("smooth-scroll")) {
						scrollbar.addListener(() => {
							scene.refresh()
						});
					}
				})
			} , 2000 );
			
			TweenMax.to($("#show-filters"), 0, {opacity:0, delay:0.05, ease:Power2.easeOut});
			
		}
	
	}//End Portfolio

	

/*--------------------------------------------------
Function Shortcodes
---------------------------------------------------*/
	
	function Shortcodes() {

		// Accordion	  
		
		$('dd.accordion-content').slideUp(1).addClass('hide');		
		$('dl.accordion').on('click', 'dt', function() {
			$(this).addClass('accordion-active').next().slideDown(200).siblings('dd.accordion-content').slideUp(200).prev().removeClass('accordion-active');						
		});	
		$('dl.accordion').on('click', 'dt.accordion-active', function() {
			$(this).removeClass('accordion-active').siblings('dd.accordion-content').slideUp(200);
		});
		
		$(".flexnav").flexNav({ 'animationSpeed' : 250 });
		
		// Project Share	
		
		$("#share").jsSocials({
            showLabel: false,
    		showCount: false,
    		shares: ["facebook", "twitter", "pinterest"]
        });
		
		$('.jssocials-share').wrap( "<div class='parallax-wrap'><div class='parallax-element'></div></div>" );
	
	}//End Shortcodes
	

	
	
/*--------------------------------------------------
Function Sliders
---------------------------------------------------*/
	
	function Sliders() {
		
		setTimeout( function(){
			
			if( $('.content-slider').length > 0 ){
			
				var interleaveOffset = 0.4;
				
				var contentSliderOn = {
					progress: function() {
						var swiper = this;
						for (var i = 0; i < swiper.slides.length; i++) {
							var slideProgress = swiper.slides[i].progress;
							var innerOffset = swiper.height * interleaveOffset;
							var innerTranslate = slideProgress * innerOffset;
							var img = swiper.slides[i].querySelector("img");
							if (img) img.style.transform = "translate3d(" + innerTranslate + "px,0, 0)";
						}
					},
					touchStart: function() {
						var swiper = this;
						for (var i = 0; i < swiper.slides.length; i++) {
							swiper.slides[i].style.transition = "";
						}
					},
					setTransition: function(speed) {
						var swiper = this;
						for (var i = 0; i < swiper.slides.length; i++) {
							swiper.slides[i].style.transition = speed + "ms";
							var img = swiper.slides[i].querySelector("img");
							if (img) img.style.transition = speed + "ms";
						}
					}
				};

				var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

				$(".content-slider").each(function () {
					var $slider = $(this);
					var existing = $slider[0].swiper;
					if (existing && typeof existing.destroy === "function") {
						existing.destroy(true, true);
					}

					var ContentSliderOptions = {
						direction: "horizontal",
						loop: true,
						slidesPerView: 1,
						paginationClickable: true,
						spaceBetween: 0,
						mousewheelControl: false,
						simulateTouch: false,
						speed: 1000,
						navigation: {
							nextEl: $slider.find(".slider-button-next")[0],
							prevEl: $slider.find(".slider-button-prev")[0],
						},
						on: contentSliderOn,
					};

					if ($slider.hasClass("guestpro-autoplay-slider") && !reducedMotion) {
						ContentSliderOptions.autoplay = {
							delay: 4500,
							disableOnInteraction: false,
						};
					}

					new Swiper(this, ContentSliderOptions);
				});
				
				$(".slider-button-prev").mouseenter(function(e) {	
					TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
					$( "#ball" ).addClass("with-icon").append( '<i class="fa fa-chevron-left"></i>' );
				});
					
				$(".slider-button-prev").mouseleave(function(e) {
					TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
					$("#ball").removeClass("with-icon");
					$('#ball i').remove();
				});
				
				$(".slider-button-next").mouseenter(function(e) {	
					TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
					$( "#ball" ).addClass("with-icon").append( '<i class="fa fa-chevron-right"></i>' );
				});
					
				$(".slider-button-next").mouseleave(function(e) {
					TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
					TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
					$("#ball").removeClass("with-icon");
					$('#ball i').remove();
				});
				
			}
			
			
			if( $('.content-carousel').length > 0 ){
			
				var ContentCarouselOptions = {			
					direction: 'horizontal',
					simulateTouch: true,
					slidesPerView: 'auto',
					spaceBetween: 0,
					mousewheelControl: false,
					speed: 700,
					grabCursor: true,
					watchOverflow: true,
					resistanceRatio: 0.85,
					touchRatio: 1,
					threshold: 8,
					longSwipesRatio: 0.25,
					touchStartPreventDefault: false,
					preventClicks: false,
					preventClicksPropagation: false,
				}
				
				var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
				
				$('.content-carousel').each(function () {
					if (this.swiper && typeof this.swiper.destroy === 'function') {
						this.swiper.destroy(true, true);
					}
					var opts = $.extend({}, ContentCarouselOptions);
					if ($(this).hasClass('guestpro-team-carousel')) {
						opts.watchOverflow = false;
						opts.followFinger = true;
					}
					var swiper = new Swiper(this, opts);
					var $carousel = $(this);
					var refresh = function () {
						try { swiper.update(); } catch (e) {}
					};
					if ($carousel.hasClass('guestpro-team-carousel') || $carousel.hasClass('guestpro-endorsement-carousel')) {
						$carousel.find('img').on('load', refresh);
						setTimeout(refresh, 100);
						setTimeout(refresh, 600);
						$(window).on('resize.guestproTeamCarousel', refresh);
					}
				});
				
				if (!isTouchDevice) {
					$('.content-carousel').on('mousedown', function(event) {
						TweenMax.to('.swiper-slide img', 0.7,{scale: 0.9});
						$("body").addClass("drag-cursor");
					});
					
					$('body').on('mouseup', function(event) {
						TweenMax.to('.swiper-slide img', 0.7,{scale:1});
						$("body").removeClass("drag-cursor");
					});
					
					$('.content-carousel').on('mouseenter mousemove', function() {	
						TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
						$("body" ).addClass("scale-drag");
					});
						
					$('.content-carousel').on('mouseleave', function() {
						TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
						$("body").removeClass("scale-drag").removeClass("drag-cursor");
					});
					
					$("body").mouseleave(function(e) {
						TweenMax.to('.swiper-slide img', 0.7,{scale:1});
						$("body").removeClass("scale-drag").removeClass("drag-cursor");
					});
				}
			
			}
			
			
			if( $('.content-looped-carousel').length > 0 ){
			
				var ContentLoopedCarouselOptions = {			
					direction: 'horizontal',
					simulateTouch: true,
					slidesPerView: 'auto',
					spaceBetween: 150,
					centeredSlides: true,
					loop:true,
					mousewheelControl: false,
					speed: 700,			
				}
				
				var swiper = new Swiper(".content-looped-carousel", ContentLoopedCarouselOptions);
				
				$('.content-looped-carousel').on('mousedown touchstart', function(event) {
					TweenMax.to('.swiper-slide img', 0.7,{scale: 0.9});
					$("body").addClass("drag-cursor");
				});
				
				$('body').on('mouseup touchend', function(event) {
					TweenMax.to('.swiper-slide img', 0.7,{scale:1});
					$("body").removeClass("drag-cursor");
				});
				
				$('.content-looped-carousel').on('mouseenter mousemove', function() {	
					TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
					$("body" ).addClass("scale-drag");
				});
					
				$('.content-looped-carousel').on('mouseleave', function() {
					TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
					$("body").removeClass("scale-drag").removeClass("drag-cursor");
				});
				
				$("body").mouseleave(function(e) {
					TweenMax.to('.swiper-slide img', 0.7,{scale:1});
					$("body").removeClass("scale-drag").removeClass("drag-cursor");
				});
			
			}
		
		} , 400 );
		
	}//End Sliders	
	
	
/*--------------------------------------------------
Function Justified Grid
---------------------------------------------------*/	
	
	function JustifiedGrid() {
		
		if( $('#justified-grid').length > 0 ){
		
			$('#justified-grid').justifiedGallery({
				rowHeight : 300,
				lastRow : 'nojustify',
				margins : 10
			});
		
		}
		
	}//End Justified Grid	
	
	
/*--------------------------------------------------
Function Lightbox
---------------------------------------------------*/
	
	function Lightbox() {
		
		$('.image-link').magnificPopup({
		  	type: 'image',
			mainClass: 'mfp-with-zoom',	
			gallery: {
			  enabled:true
			},		
			zoom: {
				enabled: true, 			
				duration: 300, 
				easing: 'ease-in-out', 
				opener: function(openerElement) {
					return openerElement.is('img') ? openerElement : openerElement.find('img');
				}
			}			
		});
		
		$(".image-link").mouseenter(function(e) {	
			TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '2px', top: 2, left: 2});
			$( "#ball" ).addClass("with-icon").append( '<i class="fa fa-plus"></i>' );
		});
			
		$(".image-link").mouseleave(function(e) {
			TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
			TweenMax.to('#ball-loader', 0.2,{borderWidth: '4px', top: 0, left: 0});
			$("#ball").removeClass("with-icon");
			$('#ball i').remove();
		});
			
	}//End Lightbox	
	
	
	
/*--------------------------------------------------
Function Contact Formular
---------------------------------------------------*/

	function guestProShowContactPopup(type, title, body) {
		var $popup = $("#guestpro-contact-popup");
		if (!$popup.length) {
			alert(title + "\n\n" + body);
			return;
		}
		$popup
			.removeClass("is-success is-error")
			.addClass(type === "success" ? "is-success" : "is-error")
			.addClass("is-visible")
			.attr("aria-hidden", "false");
		$("#guestpro-contact-popup-title").text(title);
		$("#guestpro-contact-popup-body").text(body);
	}

	function guestProHideContactPopup() {
		$("#guestpro-contact-popup")
			.removeClass("is-visible is-success is-error")
			.attr("aria-hidden", "true");
	}

	function guestProBindContactPopupDismiss() {
		$(document)
			.off("click.guestproContactPopup", "[data-guestpro-popup-close]")
			.on("click.guestproContactPopup", "[data-guestpro-popup-close]", function () {
				guestProHideContactPopup();
			});
		$(document)
			.off("keydown.guestproContactPopup")
			.on("keydown.guestproContactPopup", function (e) {
				if (e.key === "Escape") guestProHideContactPopup();
			});
	}

	function guestProIsValidEmail(value) {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
	}

	function ContactForm() {
		if ($("#contact-formular").length === 0) return;

		var cfg = window.GUESTPRO_SITE || {};
		var contactAction = cfg.contactFormAction || "/api/public/contact";
		var $form = $("#contactform");

		guestProBindContactPopupDismiss();
		$form.attr("action", contactAction);
		$form.off("submit.guestproContact");

		$form.on("submit.guestproContact", function (e) {
			e.preventDefault();

			var name = $.trim($("#name").val());
			var email = $.trim($("#email").val());
			var comments = $.trim($("#comments").val());

			if (!name) {
				guestProShowContactPopup(
					"error",
					"Missing information",
					"Please enter your name."
				);
				return false;
			}
			if (!guestProIsValidEmail(email)) {
				guestProShowContactPopup(
					"error",
					"Invalid email",
					"Please enter a valid email address."
				);
				return false;
			}
			if (!comments) {
				guestProShowContactPopup(
					"error",
					"Missing information",
					"Please enter your message."
				);
				return false;
			}

			$("#submit").prop("disabled", true);

			$.ajax({
				url: contactAction,
				type: "POST",
				data: { name: name, email: email, comments: comments },
				dataType: "html",
				timeout: 30000,
			})
				.done(function (data) {
					if (/success_page|successfully/i.test(String(data))) {
						guestProShowContactPopup(
							"success",
							"Message sent successfully",
							"Thank you. We received your message and will get back to you as soon as possible."
						);
						$form[0].reset();
						$("#message").hide().empty();
					} else {
						var errText = "We could not send your message. Please try again or email us directly.";
						if (/error_message/i.test(String(data))) {
							var match = String(data).match(/error_message[^>]*>([^<]+)/i);
							if (match && match[1]) errText = match[1].trim();
						}
						guestProShowContactPopup("error", "Unable to send", errText);
					}
				})
				.fail(function () {
					var inbox = cfg.contactInboxEmail || "omerfarukyilmazrbusiness@gmail.com";
					guestProShowContactPopup(
						"error",
						"Unable to send",
						"We could not reach the server. Please try again in a moment or email " + inbox + "."
					);
				})
				.always(function () {
					$("#submit").prop("disabled", false);
				});

			return false;
		});
	} //End ContactForm
	
	
	
/*--------------------------------------------------
Function Page PlayVideo
---------------------------------------------------*/	


	function PlayVideo() {
	
		if( $('.video-wrapper').length > 0 ){
			
			
			$(".video-wrapper").mouseenter(function(e) {
				if ($(this).hasClass("play")) {
					$( "#ball" ).addClass("pause-movie")		
				}
				TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
				$( "#ball" ).addClass("over-movie").append( '<i class="fa fa-play"></i><i class="fa fa-pause"></i>' );
			});
			
			$(".video-wrapper").mouseleave(function(e) {
				TweenMax.to('#ball', 0.2,{borderWidth: '4px', scale:0.5, borderColor:'#999999',});
				$("#ball").removeClass("over-movie").removeClass("pause-movie");
				$('#ball i').remove();
			});
			
			$(".video-wrapper .control").mouseenter(function(e) {	
				TweenMax.to('#ball', 0.2,{borderWidth: '20px', scale: 0});
			});
			
			$(".video-wrapper .control").mouseleave(function(e) {
				TweenMax.to('#ball', 0.2,{borderWidth: '2px', scale: 1, borderColor:'#fff',});
			});
			
			var videocenter = ($(window).height() - $('.video-cover').height()) / 2
					
			////////////////////////////////////////////////////// REFACTOR //////////////////////////////////////////////////////
			// plays or pause the video function of its current state
			var playpause = function( videoObj ) {
				
				if( videoObj[0] != null ){
					if(videoObj[0].paused || videoObj[0].ended) {
						
						videoObj.parent().addClass('play');
						videoObj[0].play();
					}
					else {
						
						videoObj.parent().removeClass('play');
						videoObj[0].pause();
					}
				}
			};
			
			//Time format converter - 00:00
			var timeFormat = function(seconds){
				var m = Math.floor(seconds/60)<10 ? "0"+Math.floor(seconds/60) : Math.floor(seconds/60);
				var s = Math.floor(seconds-(m*60))<10 ? "0"+Math.floor(seconds-(m*60)) : Math.floor(seconds-(m*60));
				return m+":"+s;
			};
			
			// Events
			// click to video cover - will start the video
			$('.video-wrapper').on('click', function() {
				
				$('html,body').animate({scrollTop: $(this).offset().top - videocenter},390);		
				// hide the video cover in order to start playing
				$(this).find('.video-cover').addClass('hidden');
				
				$( "#ball" ).toggleClass("pause-movie");
				
				// pause first the other videos
				var current_wrapper = $(this);
				$('#main-page-content').find('.video-wrapper').each(function() {
					
					if( !current_wrapper.is( $(this) ) ){
						
						$(this).removeClass('play');
						$(this).find('video').each(function() {
							
							if( !$(this).get(0).paused && !$(this).get(0).ended ) {
								
								$(this).get(0).pause();
							}
						});
					}
					
				});
				
				// trigger the click for the inner video
				$(this).find('video').each(function() {

					playpause( $(this) );
				});

			});
			
			//fullscreen button clicked
			$('.btnFS').on('click', function( e ) {
					
				var parent_wrapper	= $(this).closest('.video-wrapper');
				var video_object 		= parent_wrapper.find('video');
					
				if($.isFunction(video_object[0].webkitEnterFullscreen)) {
					video_object[0].webkitEnterFullscreen();
				}	
				else if ($.isFunction(video_object[0].mozRequestFullScreen)) {
					video_object[0].mozRequestFullScreen();
				}
				else {
					alert('Your browsers doesn\'t support fullscreen');
				}
				
				// prevent video wrapper div responding the event
				e.stopPropagation();
				
			});
				
			//sound button clicked
			$('.sound').on('click', function( e ) {
					
				var parent_wrapper	= $(this).closest('.video-wrapper');
				var video_object 		= parent_wrapper.find('video');
					
				video_object[0].muted = !video_object[0].muted;
				$(this).toggleClass('muted');
				if(video_object[0].muted) {
					parent_wrapper.find('.volumeBar').css('width',0);
				}
				else{
					parent_wrapper.find('.volumeBar').css('width', video_object[0].volume*100+'%');
				}
				
				// prevent video wrapper div responding the event
				e.stopPropagation();
			});
			
			//progress bar (video timebar) clicked
			$('.progress').on('click', function( e ) {
				
				var parent_wrapper	= $(this).closest('.video-wrapper');
				var video_object 		= parent_wrapper.find('video');
									
				// calculate click position
				// and update video current time
				// as well as progress bar
				var maxduration 	= video_object[0].duration;
				var position 			= e.pageX - $(this).offset().left;
				var percentage 	= 100 * position / $(this).width();
				if(percentage > 100) {
					
					percentage = 100;
				}
				if(percentage < 0) {
					
					percentage = 0;
				}
				$('.timeBar').css('width', percentage+'%');	
				video_object[0].currentTime = maxduration * percentage / 100;
				
				// prevent video wrapper div responding the event
				e.stopPropagation();
			});
			
			$('#main-page-content').find('video').each(function() {
			
				var video = $(this);
				var video_wrapper = $(this).parent();
				
				//remove default control when JS loaded
				video[0].removeAttribute("controls");
				video_wrapper.find('.control').fadeIn(500);
				video_wrapper.find('.caption').fadeIn(500);
			 
				//before everything get started and we have the info about the video such as duration
				video.on('loadedmetadata', function() {
					
					var video_object = $(this);
					var parent_wrapper = $(this).parent();
					//set video properties
					parent_wrapper.find('.current').text(timeFormat(0));
					parent_wrapper.find('.duration').text(timeFormat(video[0].duration));
					
				});
				
				//display current video buffered progress
				video.on('progress', function() {
					
					var video_object 		= $(this);
					var parent_wrapper 	= $(this).parent();
					var maxduration 		= video_object [0].duration;
					
					if (maxduration > 0) {
					  for (var i = 0; i < video_object [0].buffered.length; i++) {
							if (video_object [0].buffered.start(video_object [0].buffered.length - 1 - i) <video_object [0].currentTime) {
								var perc = (video_object [0].buffered.end(video_object [0].buffered.length - 1 - i) / maxduration) * 100 + "%";
								parent_wrapper.find('.bufferBar').css('width',perc+'%');
								break;
							}
						}
					}
					
				});
				
				//display current video play time
				video.on('timeupdate', function() {
					
					var parent_wrapper 	= $(this).parent();
					var currentPos 			= $(this).get(0).currentTime;
					var maxduration 		= $(this).get(0).duration;
					var perc 					= 100 * currentPos / maxduration;
					parent_wrapper.find('.timeBar').css('width',perc+'%');	
					parent_wrapper.find('.current').text(timeFormat(currentPos));	
				});
				
				//video screen and play button clicked
				video.on('click', function() { 
					
					playpause( $(this) ); 
				});
				
				//video canplay event
				video.on('canplay', function() {
					
					var parent_wrapper = $(this).parent();
					parent_wrapper.find('.loading').fadeOut(100); //?
				});
				
				//video canplaythrough event
				//solve Chrome cache issue
				var completeloaded = false;
				video.on('canplaythrough', function() {
					
					completeloaded = true;
				});
				
				//video ended event
				video.on('ended', function() {		
					
					$(this).get(0).pause();
					$(this).parent().removeClass("play");
					$( "#ball" ).toggleClass("pause-movie");
				});
			
				//video seeking event
				video.on('seeking', function() {
					
					//if video fully loaded, ignore loading screen
					if(!completeloaded) { 
						var parent_wrapper = $(this).parent();
						parent_wrapper.find('.loading').fadeIn(200); //?
					}	
				});
				
				//video seeked event
				video.on('seeked', function() { });
				
				//video waiting for more data event
				video.on('waiting', function() {
					
					var parent_wrapper = $(this).parent();
					parent_wrapper.find('.loading').fadeIn(200); //?
				});
				
			});
			
		}
		
	}// End PlayVideo					
	
	
	/*--------------------------------------------------
Function Contact Map
---------------------------------------------------*/	
		
	function ContactMap() {	
	
		if( jQuery('#map_canvas').length > 0 ){					
			var latlng = new google.maps.LatLng(43.270441,6.640888);
			var settings = {
				zoom: 14,
				center: new google.maps.LatLng(43.270441,6.640888),
				mapTypeControl: false,
				scrollwheel: false,
				draggable: true,
				panControl:false,
				scaleControl: false,
				zoomControl: false,
				streetViewControl:false,
				navigationControl: false};			
				var newstyle = [
				{
					"featureType": "all",
					"elementType": "labels.text.fill",
					"stylers": [
						{
							"saturation": 36
						},
						{
							"color": "#000000"
						},
						{
							"lightness": 40
						}
					]
				},
				{
					"featureType": "all",
					"elementType": "labels.text.stroke",
					"stylers": [
						{
							"visibility": "on"
						},
						{
							"color": "#000000"
						},
						{
							"lightness": 16
						}
					]
				},
				{
					"featureType": "all",
					"elementType": "labels.icon",
					"stylers": [
						{
							"visibility": "off"
						}
					]
				},
				{
					"featureType": "administrative",
					"elementType": "geometry.fill",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 20
						}
					]
				},
				{
					"featureType": "administrative",
					"elementType": "geometry.stroke",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 17
						},
						{
							"weight": 1.2
						}
					]
				},
				{
					"featureType": "landscape",
					"elementType": "geometry",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 20
						}
					]
				},
				{
					"featureType": "poi",
					"elementType": "geometry",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 21
						}
					]
				},
				{
					"featureType": "road.highway",
					"elementType": "geometry.fill",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 17
						}
					]
				},
				{
					"featureType": "road.highway",
					"elementType": "geometry.stroke",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 29
						},
						{
							"weight": 0.2
						}
					]
				},
				{
					"featureType": "road.arterial",
					"elementType": "geometry",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 18
						}
					]
				},
				{
					"featureType": "road.local",
					"elementType": "geometry",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 16
						}
					]
				},
				{
					"featureType": "transit",
					"elementType": "geometry",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 19
						}
					]
				},
				{
					"featureType": "water",
					"elementType": "geometry",
					"stylers": [
						{
							"color": "#000000"
						},
						{
							"lightness": 17
						}
					]
				}
			];
			var mapOptions = {
				styles: newstyle,
				mapTypeControlOptions: {
					 mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'holver']
				}
			};
			var map = new google.maps.Map(document.getElementById("map_canvas"), settings);	
			var mapType = new google.maps.StyledMapType(newstyle, { name:"Grayscale" });    
				map.mapTypes.set('holver', mapType);
				map.setMapTypeId('holver');
						
			
			google.maps.event.addDomListener(window, "resize", function() {
				var center = map.getCenter();
				google.maps.event.trigger(map, "resize");
				map.setCenter(center);
			});	
			var contentString = '<div id="content-map-marker" style="text-align:center; padding-top:10px; padding-left:10px">'+
				'<div id="siteNotice">'+
				'</div>'+
				'<h4 id="firstHeading" class="firstHeading" style="color:#000!important; font-weight:600; margin-bottom:0px;">Hello Friend!</h4>'+
				'<div id="bodyContent">'+
				'<p color:#999; font-size:14px; margin-bottom:10px">Here we are. Come to drink a coffee!</p>'+
				'</div>'+
				'</div>';
			var infowindow = new google.maps.InfoWindow({
				content: contentString
			});	
			var companyImage = new google.maps.MarkerImage('images/marker.png',
				new google.maps.Size(58,63),<!-- Width and height of the marker -->
				new google.maps.Point(0,0),
				new google.maps.Point(35,20)<!-- Position of the marker -->
			);
			var companyPos = new google.maps.LatLng(43.270441,6.640888);	
			var companyMarker = new google.maps.Marker({
				position: companyPos,
				map: map,
				icon: companyImage,               
				title:"Our Office",
				zIndex: 3});	
			google.maps.event.addListener(companyMarker, 'click', function() {
				infowindow.open(map,companyMarker);
			});	
		}
		
		return false
	
	}//End ContactMap
	
	
/*--------------------------------------------------
Function Load Via Ajax
---------------------------------------------------*/	
		
	function LoadViaAjax() {		
		
		applyGuestProSiteMode();
		initGuestProNavAndDemo();
		FirstLoad();
		ScrollEffects();
		initGuestProEndorsementQuote();
		Showcase();
		ShowcaseCarousel();
		LazyLoad();				
		Portfolio();
		FitThumbScreen();	
		Shortcodes();
		Sliders();
		JustifiedGrid();
		Lightbox();
		ContactForm();
		PlayVideo();
		ContactMap();
	
	}//End Load Via Ajax


/*--------------------------------------------------
Guest Pro: endorsement quote (letter-by-letter)
---------------------------------------------------*/

	function initGuestProEndorsementQuote() {
		$(".guestpro-endorsement-quote").each(function () {
			var el = this;
			var $el = $(el);
			if ($el.data("guestproQuoteInit")) return;
			$el.data("guestproQuoteInit", true);

			var raw = ($el.attr("data-quote") || $el.text() || "")
				.replace(/^[\s\u201c\u201d"']+|[\s\u201c\u201d"']+$/g, "")
				.trim();
			if (!raw) return;

			$el.empty().attr("aria-label", raw);

			var $open = $('<span class="guestpro-quote-mark guestpro-quote-open" aria-hidden="true"></span>').text("\u201c");
			var $body = $('<span class="guestpro-quote-body"></span>');
			var $close = $('<span class="guestpro-quote-mark guestpro-quote-close" aria-hidden="true"></span>').text("\u201d");
			$el.append($open, $body, $close);

			var charIndex = 0;
			var words = raw.split(/\s+/);

			words.forEach(function (word, wi) {
				var $word = $('<span class="guestpro-quote-word"></span>');
				for (var i = 0; i < word.length; i++) {
					$word.append(
						$('<span class="guestpro-quote-char"></span>')
							.text(word.charAt(i))
							.css("animation-delay", charIndex * 0.022 + "s")
					);
					charIndex++;
				}
				$body.append($word);
				if (wi < words.length - 1) {
					$body.append(
						$('<span class="guestpro-quote-word guestpro-quote-space"></span>').append(
							$('<span class="guestpro-quote-char"></span>')
								.html("&nbsp;")
								.css("animation-delay", charIndex * 0.022 + "s")
						)
					);
					charIndex++;
				}
			});

			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
				$el.addClass("is-typing is-complete");
				return;
			}

			if (!("IntersectionObserver" in window)) {
				$el.addClass("is-typing is-complete");
				return;
			}

			var io = new IntersectionObserver(
				function (entries) {
					entries.forEach(function (entry) {
						if (!entry.isIntersecting) return;
						$el.addClass("is-typing");
						io.disconnect();
						var totalMs = charIndex * 22 + 400;
						window.setTimeout(function () {
							$el.addClass("is-complete");
						}, totalMs);
					});
				},
				{ threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
			);
			io.observe(el);
		});
	}

	
					
	
		
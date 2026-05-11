gsap.registerPlugin(ScrollTrigger);

let allowScroll = true; // sometimes we want to ignore scroll-related stuff, like when an Observer-based section is transitioning.
let scrollTimeout = gsap.delayedCall(1, () => allowScroll = true).pause(); // controls how long we should wait after an Observer-based animation is initiated before we allow another scroll-related action
let currentIndex = 0;
let swipePanels = gsap.utils.toArray(".swipe-section .panel");
const isTouch = ScrollTrigger.isTouch;

if (isTouch === 1) {
  ScrollTrigger.normalizeScroll(true);
}

// set z-index levels for the swipe panels
gsap.set(swipePanels, { zIndex: i => swipePanels.length - i})

// create an observer and disable it to start
let intentObserver = ScrollTrigger.observe({
  type: "wheel,touch",
  onUp: () => allowScroll && gotoPanel(currentIndex - 1, false),
  onDown: () => allowScroll && gotoPanel(currentIndex + 1, true),
  tolerance: 10,
  scrollSpeed: isTouch === 1 ? 1 : -1,
  preventDefault: true,
  onEnable(self) {
    allowScroll = false;
    scrollTimeout.restart(true);
    // when enabling, we should save the scroll position and freeze it. This fixes momentum-scroll on Macs, for example.
    let savedScroll = self.scrollY();
    self._restoreScroll = () => self.scrollY(savedScroll); // if the native scroll repositions, force it back to where it should be
    document.addEventListener("scroll", self._restoreScroll, {passive: false});
  },
  onDisable: self => document.removeEventListener("scroll", self._restoreScroll)
});
intentObserver.disable();

// handle the panel swipe animations
function gotoPanel(index, isScrollingDown) {
  // return to normal scroll if we're at the end or back up to the start
  if ((index === swipePanels.length && isScrollingDown) || (index === -1 && !isScrollingDown)) {
    intentObserver.disable(); // resume native scroll
    return;
  }
  allowScroll = false;
  scrollTimeout.restart(true);

  let target = isScrollingDown ? swipePanels[currentIndex] : swipePanels[index];
  gsap.to(target, {
    yPercent: isScrollingDown ? -100 : 0,
    duration: 0.75
  });

  currentIndex = index;
}

// pin swipe section and initiate observer
ScrollTrigger.create({
  trigger: ".swipe-section",
  pin: true,
  start: "top top",
  end: "+=200", // just needs to be enough to not risk vibration where a user's fast-scroll shoots way past the end
  onEnter: (self) => {
    if (intentObserver.isEnabled) { return } // in case the native scroll jumped past the end and then we force it back to where it should be.
    self.scroll(self.start + 1); // jump to just one pixel past the start of this section so we can hold there.
    intentObserver.enable(); // STOP native scrolling
  },
  onEnterBack: (self) => {
    if (intentObserver.isEnabled) { return } // in case the native scroll jumped backward past the start and then we force it back to where it should be.
    self.scroll(self.end - 1); // jump to one pixel before the end of this section so we can hold there.
    intentObserver.enable(); // STOP native scrolling
  }
});

// horizontal scrolling section 
let horizontalSections = gsap.utils.toArray(".horizontal .panel");
gsap.to(horizontalSections, {
  xPercent: -100 * (horizontalSections.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: '.horizontal',
    pin: true,
    scrub: 1,
    end: "+=3500",
    markers: true,
  }
});

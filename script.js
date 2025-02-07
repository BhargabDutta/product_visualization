// Set the total number of frames (adjust based on your actual frame count)
let frameCount = 1000;

// Update the URLs to load local images from a folder named "frames" (local path)
let urls = new Array(frameCount).fill().map((o, i) => `S2/frame${(i + 1).toString().padStart(4, '0')}.webp`);

// Calling the imageSequence function with the local image URLs
imageSequence({
  urls,
  canvas: "#image-sequence", 
  fps: 30,  // Adjust FPS for better smoothness
  scrollTrigger: {
    trigger: "#scroll-container",  // Your scroll container element
    start: "top top",              // Trigger when the container hits the top
    end: "bottom bottom",          // End when the container hits the bottom
    scrub: 0.1,                    // Use a smaller scrub time (e.g., 0.5 seconds)
    anticipatePin: 1,
    markers: false,
  }
});

/*
Helper function that handles scrubbing through a sequence of images, drawing the appropriate one to the provided canvas.
Config object properties: 
- urls [Array]: an Array of image URLs
- canvas [Canvas]: the <canvas> object to draw to
- scrollTrigger [Object]: an optional ScrollTrigger configuration object like {trigger: "#trigger", start: "top top", end: "+=1000", scrub: true, pin: true}
- clear [Boolean]: if true, it'll clear out the canvas before drawing each frame (useful if your images contain transparency)
- paused [Boolean]: true if you'd like the returned animation to be paused initially (this isn't necessary if you're passing in a ScrollTrigger that's scrubbed, but it is helpful if you just want a normal playback animation)
- fps [Number]: optional frames per second - this determines the duration of the returned animation. This doesn't matter if you're using a scrubbed ScrollTrigger. Defaults to 30fps.
- onUpdate [Function]: optional callback for when the Tween updates (probably not used very often). It'll pass two parameters: 1) the index of the image (zero-based), and 2) the Image that was drawn to the canvas

Returns a Tween instance
*/
function imageSequence(config) {
  let playhead = { frame: 0 },
      canvas = gsap.utils.toArray(config.canvas)[0] || console.warn("canvas not defined"),
      ctx = canvas.getContext("2d"),
      curFrame = -1,
      onUpdate = config.onUpdate,
      images = [],
      lastDrawTime = 0,
      totalFrames = config.urls.length;

  // Preload images
  let loadedImages = 0;
  config.urls.forEach((url, i) => {
    let img = new Image();
    img.onload = () => {
      loadedImages++;
      images[i] = img;
      if (loadedImages === totalFrames) {
        // Start animation only when all images are loaded
        gsap.to(playhead, {
          frame: totalFrames - 1,
          ease: "none",
          scrollTrigger: config.scrollTrigger,
          onUpdate: updateImage,
          duration: totalFrames / (config.fps || 30),  // Adjust FPS here
          paused: !!config.paused,
        });
      }
    };
    img.src = url;
  });

  // Update function to draw the correct frame
  function updateImage() {
    if (isDrawing) return;  // Prevent multiple frame draws at once

    isDrawing = true;

    requestAnimationFrame(() => {
        let frame = Math.floor(playhead.frame);
        if (frame !== curFrame) {
            curFrame = frame;
            const img = images[frame];
            ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing the new image
            
            // Calculate scaling to fit the image inside the canvas
            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;
            let drawWidth, drawHeight;

            if (imgAspect > canvasAspect) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgAspect;
            } else {
                drawHeight = canvas.height;
                drawWidth = canvas.height * imgAspect;
            }

            // Apply better image rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Draw the image centered on the canvas
            ctx.drawImage(img, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
            onUpdate && onUpdate.call(this, frame, img);
        }

        isDrawing = false;
    });
}


  let isDrawing = false;  // Flag to prevent multiple draws in one frame

  return gsap.to(playhead, {
    frame: totalFrames - 1,
    ease: "none",
    onUpdate: updateImage,
    duration: totalFrames / (config.fps || 30),
    paused: !!config.paused,
    scrollTrigger: config.scrollTrigger
  });
}

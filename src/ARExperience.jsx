import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import gsap from "gsap";

const portfolioData = {
  "Living Room": {
    title: "Royal Living Suite",
    location: "Siripuram, Vizag",
    bgGrad: ["#0F172A", "#1E293B"],
    accent: "#D4AF37",
    icon: "🛋️",
    desc: "Italian Statuario marble flooring, custom brass accent inlays, motorized cove lighting, and acoustic oak wood paneling.",
    specs: ["Italian Statuario Marble", "Custom Brass Inlays", "Motorized Cove Lighting", "Acoustic Oak Paneling"]
  },
  "Kitchen": {
    title: "Minimalist Kitchen",
    location: "Beach Road, Vizag",
    bgGrad: ["#1E1B18", "#2A241F"],
    accent: "#F3E5AB",
    icon: "🍳",
    desc: "Calacatta Gold Quartz countertops, handleless touch-to-open acrylic cabinets, and concealed smart appliances.",
    specs: ["Calacatta Gold Quartz", "Touch-to-Open Cabinets", "Concealed Smart Tech", "Waterfall Island Design"]
  },
  "Bedroom": {
    title: "Master Sanctuary",
    location: "MVP Colony, Vizag",
    bgGrad: ["#1A1412", "#2D221E"],
    accent: "#E5C158",
    icon: "🛏️",
    desc: "Smoked oak veneer wall paneling, hand-tufted acoustic velvet headboard, and automated glass wardrobe lighting.",
    specs: ["Smoked Oak Veneer", "Tufted Velvet Headboard", "Automated Glass Wardrobe", "Ambient Accent Lighting"]
  },
  "Commercial": {
    title: "Executive Lounge",
    location: "Tech Park, Vizag",
    bgGrad: ["#091E2A", "#123042"],
    accent: "#38BDF8",
    icon: "🏢",
    desc: "Bespoke 16-seater boardroom acoustics, Italian full-grain leather finishes, and dynamic brand logo LED lighting.",
    specs: ["16-Seater Boardroom", "Full-Grain Italian Leather", "Dynamic LED Brand Logo", "Acoustic Wall Panels"]
  }
};

export default function ARExperience() {
  const containerRef = useRef(null);
  const [arStarted, setArStarted] = useState(false);
  const [targetFound, setTargetFound] = useState(false);
  const targetFoundRef = useRef(false);
  const targetLostTimerRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("Living Room");
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);

  // State: Is Portfolio Panel Slid Out to the Right
  const [isPortfolioSlidOut, setIsPortfolioSlidOut] = useState(false);
  const isPortfolioSlidOutRef = useRef(false);

  // References
  const mindarRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const anchorGroupRef = useRef(null);
  const mainSpatialGroupRef = useRef(null);
  const cardMeshRef = useRef(null);
  const mm3DGroupRef = useRef(null);
  const videoGroupRef = useRef(null);
  const portfolioGroupRef = useRef(null);
  const portfolioCanvasRef = useRef(null);
  const portfolioTextureRef = useRef(null);
  const portfolioCtxRef = useRef(null);
  const videoElementRef = useRef(null);
  const videoTextureRef = useRef(null);
  const fallbackVideoCanvasRef = useRef(null);
  const fallbackVideoTextureRef = useRef(null);
  const slideBtnCanvasRef = useRef(null);
  const slideBtnTextureRef = useRef(null);
  const slideBtnMeshRef = useRef(null);
  const selectedCategoryRef = useRef("Living Room");
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const portfolioWebMeshRef = useRef(null);
  const videoMeshRef = useRef(null);
  const actionMeshesRef = useRef([]);
  const dirLightRef = useRef(null);
  const isAnimatingRef = useRef(false);

  // Pinch Zoom Gesture References - Mobile Scale (0.38)
  const initialPinchDistRef = useRef(0);
  const initialScaleRef = useRef(0.38);
  const spatialScaleRef = useRef(0.38);

  const triggerToast = (msg) => {
    console.log(`[AR Notification]: ${msg}`);
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  // Slide Out Portfolio Panel to the Right (Positioned at x = 2.7, scale = 1.05 with auto scene re-centering)
  const togglePortfolioSlide = (e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setTimeout(() => { isAnimatingRef.current = false; }, 400);

    const nextState = !isPortfolioSlidOutRef.current;
    isPortfolioSlidOutRef.current = nextState;
    setIsPortfolioSlidOut(nextState);

    // Update Slide Button Texture
    if (slideBtnCanvasRef.current && slideBtnTextureRef.current) {
      const ctx = slideBtnCanvasRef.current.getContext("2d");
      ctx.fillStyle = nextState ? "#D4AF37" : "#141822";
      ctx.fillRect(0, 0, 360, 100);

      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 348, 88);

      ctx.fillStyle = nextState ? "#07090D" : "#F3E5AB";
      ctx.font = "bold 24px \"Plus Jakarta Sans\", sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(nextState ? "◀ HIDE PORTFOLIO" : "▶ SLIDE PORTFOLIO", 180, 60);

      slideBtnTextureRef.current.needsUpdate = true;
    }

    if (nextState) {
      // SLIDE PORTFOLIO OUT TO THE RIGHT AT X = 2.7 (Visible adjacent to Card)
      console.log("▶ [Slide Action] Sliding Portfolio panel out next to business card");

      if (portfolioGroupRef.current) {
        portfolioGroupRef.current.visible = true;
        portfolioGroupRef.current.position.set(2.25, 0.0, -0.1);
        portfolioGroupRef.current.scale.set(0, 0, 0);

        gsap.to(portfolioGroupRef.current.position, {
          x: 2.7, y: 0.0, z: 0.15, duration: 0.65, ease: "power3.out"
        });
        gsap.to(portfolioGroupRef.current.scale, {
          x: 1.05, y: 1.05, z: 1.05, duration: 0.65, ease: "back.out(1.2)"
        });
      }

      // Smoothly shift main spatial scene left to keep both Card & Portfolio centered on screen
      if (mainSpatialGroupRef.current) {
        gsap.to(mainSpatialGroupRef.current.position, {
          x: -0.3, duration: 0.65, ease: "power3.out"
        });
      }

      triggerToast("▶ Portfolio Showcase Slid Out (Expanded View)!");

    } else {
      // SLIDE PORTFOLIO BACK IN BEHIND CARD AT X = 2.25
      console.log("◀ [Slide Action] Sliding Portfolio panel back in");

      if (portfolioGroupRef.current) {
        gsap.to(portfolioGroupRef.current.position, {
          x: 2.25, y: 0.0, z: -0.1, duration: 0.5, ease: "power2.in"
        });
        gsap.to(portfolioGroupRef.current.scale, {
          x: 0, y: 0, z: 0, duration: 0.5, ease: "power2.in",
          onComplete: () => {
            if (!isPortfolioSlidOutRef.current && portfolioGroupRef.current) {
              portfolioGroupRef.current.visible = false;
            }
          }
        });
      }

      // Return main spatial scene to default right offset position x = 1.15
      if (mainSpatialGroupRef.current) {
        gsap.to(mainSpatialGroupRef.current.position, {
          x: 1.15, duration: 0.5, ease: "power2.inOut"
        });
      }

      triggerToast("◀ Portfolio Slid Back In");
    }
  };

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
    if (portfolioCtxRef.current && portfolioTextureRef.current) {
      renderPortfolioWebCanvas();
    }
  }, [selectedCategory]);

  // Create Fallback Canvas Texture for Video Screen
  const createFallbackVideoTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    fallbackVideoCanvasRef.current = canvas;

    const renderCanvas = (time = 0) => {
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, "#0B0E14");
      grad.addColorStop(0.5, "#141822");
      grad.addColorStop(1, "#07090D");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, 1240, 680);

      ctx.strokeStyle = "#AA771C";
      ctx.lineWidth = 4;
      ctx.strokeRect(36, 36, 1208, 648);

      const glow = Math.sin(time * 0.003) * 15 + 30;
      ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
      ctx.beginPath();
      ctx.arc(640, 310, 110 + glow / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#141822";
      ctx.beginPath();
      ctx.arc(640, 310, 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = "#D4AF37";
      ctx.beginPath();
      ctx.moveTo(625, 260);
      ctx.lineTo(675, 310);
      ctx.lineTo(625, 360);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 52px \"Playfair Display\", serif";
      ctx.textAlign = "center";
      ctx.fillText("MM INTERIORS SHOWCASE", 640, 480);

      ctx.fillStyle = "#F3E5AB";
      ctx.font = "bold 28px \"Plus Jakarta Sans\", sans-serif";
      ctx.fillText("✨ Turnkey Luxury Architectural Design • Vizag", 640, 535);

      ctx.fillStyle = "#A0A5B5";
      ctx.font = "22px \"Plus Jakarta Sans\", sans-serif";
      ctx.fillText("Tap screen to activate video audio & stream", 640, 590);
    };

    renderCanvas(0);
    const texture = new THREE.CanvasTexture(canvas);
    fallbackVideoTextureRef.current = texture;
    return texture;
  };

  // Bulletproof Local Interior Video Setup with Autoplay Unlock
  const initBulletproofVideoTexture = () => {
    console.log("🎬 [Video Source] Initializing bulletproof MP4 Video Stream...");

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("muted", "true");
    video.style.display = "none";
    video.src = "/video.mp4";

    if (containerRef.current) {
      containerRef.current.appendChild(video);
    }
    videoElementRef.current = video;

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBAFormat;
    videoTextureRef.current = videoTexture;

    const unlockVideo = () => {
      if (videoElementRef.current) {
        videoElementRef.current.muted = true;
        videoElementRef.current.play().then(() => {
          console.log("✅ [Video Autoplay] Stream successfully playing!");
        }).catch((err) => {
          console.warn("Autoplay gesture unlock attempt:", err);
        });
      }
    };

    window.addEventListener("touchstart", unlockVideo, { passive: true });
    window.addEventListener("pointerdown", unlockVideo, { passive: true });
    window.addEventListener("click", unlockVideo, { passive: true });

    video.load();
    unlockVideo();

    return videoTexture;
  };

  // Render High-Contrast Widescreen Portfolio Canvas (1920 x 1080) with Larger Bold Typography
  const renderPortfolioWebCanvas = () => {
    const canvas = portfolioCanvasRef.current;
    const ctx = portfolioCtxRef.current;
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const category = selectedCategoryRef.current;
    const currentData = portfolioData[category] || portfolioData["Living Room"];

    // 1. Deep Room-Specific Theme Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, currentData.bgGrad[0]);
    bgGrad.addColorStop(1, currentData.bgGrad[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Outer Gold Glow Frame
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 18;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // 2. Bright Royal Gold Header Banner
    ctx.fillStyle = "#D4AF37";
    ctx.fillRect(20, 20, width - 40, 135);

    ctx.fillStyle = "#07090D";
    ctx.font = "bold 54px \"Playfair Display\", serif";
    ctx.fillText("🏛️ MM INTERIORS ARCHITECTURAL PORTFOLIO", 60, 85);

    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 26px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("✨ Turnkey Architectural Interior Design Studio • Vizag", 60, 124);

    // 3. 4 Interactive Category Tabs across Top Banner
    const categories = [
      { name: "Living Room", icon: "🛋️" },
      { name: "Kitchen", icon: "🍳" },
      { name: "Bedroom", icon: "🛏️" },
      { name: "Commercial", icon: "🏢" }
    ];
    const tabWidth = 430;
    const tabHeight = 85;
    const startX = 60;
    const startY = 175;

    categories.forEach((catObj, index) => {
      const x = startX + index * (tabWidth + 25);
      const isSelected = catObj.name === category;

      ctx.fillStyle = isSelected ? "#D4AF37" : "rgba(255, 255, 255, 0.09)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, startY, tabWidth, tabHeight, 22);
      else ctx.rect(x, startY, tabWidth, tabHeight);
      ctx.fill();

      ctx.strokeStyle = isSelected ? "#FFFFFF" : "#D4AF37";
      ctx.lineWidth = isSelected ? 6 : 2.5;
      ctx.stroke();

      ctx.fillStyle = isSelected ? "#07090D" : "#F3E5AB";
      ctx.font = "bold 30px \"Plus Jakarta Sans\", sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${catObj.icon} ${catObj.name}`, x + tabWidth / 2, startY + 54);
    });

    ctx.textAlign = "left";

    // 4. Main Featured Showcase Card Area
    ctx.fillStyle = "#141822";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(60, 285, width - 120, 620, 30);
    else ctx.rect(60, 285, width - 120, 620);
    ctx.fill();

    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Decorative Architectural Grid Accent Lines
    ctx.strokeStyle = "rgba(212, 175, 55, 0.12)";
    ctx.lineWidth = 2;
    for (let gx = 1200; gx < width - 120; gx += 80) {
      ctx.beginPath();
      ctx.moveTo(gx, 300);
      ctx.lineTo(gx, 880);
      ctx.stroke();
    }
    for (let gy = 320; gy < 880; gy += 80) {
      ctx.beginPath();
      ctx.moveTo(1200, gy);
      ctx.lineTo(width - 120, gy);
      ctx.stroke();
    }

    // Project Title & Location
    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 34px \"Playfair Display\", serif";
    ctx.fillText(`${currentData.icon} FEATURED DESIGN SHOWCASE • ${category.toUpperCase()}`, 110, 355);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 60px \"Playfair Display\", serif";
    ctx.fillText(currentData.title.toUpperCase(), 110, 435);

    ctx.fillStyle = "#F3E5AB";
    ctx.font = "600 32px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("📍 Location: " + currentData.location, 110, 492);

    // Description text
    ctx.fillStyle = "#E5E7EB";
    ctx.font = "28px \"Plus Jakarta Sans\", sans-serif";
    const words = currentData.desc.split(" ");
    let line = "";
    let y = 560;
    words.forEach((w) => {
      const test = line + w + " ";
      if (ctx.measureText(test).width > 1000) {
        ctx.fillText(line, 110, y);
        line = w + " ";
        y += 45;
      } else {
        line = test;
      }
    });
    ctx.fillText(line, 110, y);

    // 4 Spec Tags/Badges
    const specs = currentData.specs || [];
    specs.forEach((spec, index) => {
      const specX = 110 + (index % 2) * 490;
      const specY = 705 + Math.floor(index / 2) * 75;

      ctx.fillStyle = "rgba(212, 175, 55, 0.20)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(specX, specY, 450, 62, 16);
      else ctx.rect(specX, specY, 450, 62);
      ctx.fill();

      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#F3E5AB";
      ctx.font = "bold 24px \"Plus Jakarta Sans\", sans-serif";
      ctx.fillText(`✨ ${spec}`, specX + 22, specY + 40);
    });

    // 5. Bottom Action Consultation Bar
    ctx.fillStyle = "#D4AF37";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(60, 925, width - 120, 115, 24);
    else ctx.rect(60, 925, width - 120, 115);
    ctx.fill();

    ctx.fillStyle = "#07090D";
    ctx.font = "bold 38px \"Plus Jakarta Sans\", sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`📅 TAP HERE TO BOOK CONSULTATION FOR ${category.toUpperCase()}`, width / 2, 995);

    if (portfolioTextureRef.current) {
      portfolioTextureRef.current.needsUpdate = true;
    }
  };

  useEffect(() => {
    let mindarThree = null;

    const initAR = async () => {
      console.log("==================================================");
      console.log("🚀 [WebAR Visit] INITIALIZING ROCK-SOLID WEBAR ENGINE");
      console.log("==================================================");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("Camera access requires HTTPS or a modern mobile browser.");
        return;
      }

      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });
        testStream.getTracks().forEach((track) => track.stop());
      } catch (permErr) {
        console.error("❌ [Camera Permission Denied]:", permErr);
        setErrorMessage("Camera permission denied. Please allow camera access in browser settings.");
        return;
      }

      try {
        const videoTexture = initBulletproofVideoTexture();
        const fallbackTexture = createFallbackVideoTexture();

        // Optimized OneEuroFilter settings for rock-solid tracking stability without jitter
        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: "/card.mind",
          filterMinCF: 0.0005,  // Extra smooth tracking filter
          filterBeta: 0.01,     // Smooth motion dampening
          uiLoading: "no",
          uiScanning: "no",
          uiError: "no"
        });

        mindarRef.current = mindarThree;
        const { renderer, scene, camera } = mindarThree;
        sceneRef.current = scene;
        cameraRef.current = camera;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xD4AF37, 2.2);
        dirLight.position.set(5, 8, 5);
        scene.add(dirLight);
        dirLightRef.current = dirLight;

        const pointLight = new THREE.PointLight(0xffe680, 1.5, 12);
        pointLight.position.set(-2, 3, 2);
        scene.add(pointLight);

        // TARGET ANCHOR INDEX 0
        const anchor = mindarThree.addAnchor(0);
        anchorGroupRef.current = anchor.group;

        // TARGET FOUND WITH PERSISTENCE TIMER RECOVERY
        anchor.onTargetFound = () => {
          console.log("🎯🎯🎯 [MindAR EVENT] TARGET FOUND!");

          if (targetLostTimerRef.current) {
            clearTimeout(targetLostTimerRef.current);
            targetLostTimerRef.current = null;
          }

          const isAlreadyActive = targetFoundRef.current;
          setTargetFound(true);
          targetFoundRef.current = true;

          if (mainSpatialGroupRef.current) {
            mainSpatialGroupRef.current.visible = true;
          }

          if (videoElementRef.current) {
            videoElementRef.current.muted = true;
            videoElementRef.current.play().catch(() => {});
          }

          if (!isAlreadyActive) {
            triggerToast("✨ MM Business Card Scanned!");
            animatePremiumSlideEntrance();
          }
        };

        // TARGET LOST WITH 3.5 SECOND PERSISTENCE GRACE PERIOD
        anchor.onTargetLost = () => {
          console.log("⚠️ [MindAR EVENT] TARGET LOST - Starting Persistence Grace Period...");

          if (targetLostTimerRef.current) {
            clearTimeout(targetLostTimerRef.current);
          }

          targetLostTimerRef.current = setTimeout(() => {
            console.log("⚠️ [MindAR] Grace period expired. Hiding AR scene.");
            setTargetFound(false);
            targetFoundRef.current = false;
            if (mainSpatialGroupRef.current) {
              mainSpatialGroupRef.current.visible = false;
            }
          }, 3500);
        };

        // -------------------------------------------------------------
        // PHYSICAL CARD CORNER TRACKER BRACKET (at 0,0,0)
        // -------------------------------------------------------------
        const createTargetTrackerFrame = () => {
          const trackerGroup = new THREE.Group();

          const cornerMat = new THREE.MeshBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.85 });
          const cornerLength = 0.20;
          const cornerThickness = 0.02;

          const corners = [
            { x: -0.5, y: 0.3, dx: 1, dy: -1 },
            { x: 0.5, y: 0.3, dx: -1, dy: -1 },
            { x: -0.5, y: -0.3, dx: 1, dy: 1 },
            { x: 0.5, y: -0.3, dx: -1, dy: 1 }
          ];

          corners.forEach(({ x, y, dx, dy }) => {
            const hGeo = new THREE.PlaneGeometry(cornerLength, cornerThickness);
            const hMesh = new THREE.Mesh(hGeo, cornerMat);
            hMesh.position.set(x + (dx * cornerLength / 2), y, 0.01);
            trackerGroup.add(hMesh);

            const vGeo = new THREE.PlaneGeometry(cornerThickness, cornerLength);
            const vMesh = new THREE.Mesh(vGeo, cornerMat);
            vMesh.position.set(x, y + (dy * cornerLength / 2), 0.01);
            trackerGroup.add(vMesh);
          });

          // Holographic Laser Beam connecting physical card (0.5) to AR HUD (1.15)
          const beamGeo = new THREE.PlaneGeometry(0.7, 0.02);
          const beamMat = new THREE.MeshBasicMaterial({
            color: 0xD4AF37,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide
          });
          const beamMesh = new THREE.Mesh(beamGeo, beamMat);
          beamMesh.position.set(0.85, 0, 0.01);
          trackerGroup.add(beamMesh);

          return trackerGroup;
        };

        anchor.group.add(createTargetTrackerFrame());

        // -------------------------------------------------------------
        // SPATIAL 3D COMPOSITION - Positioned at x = 1.15 (Right side of physical card)
        // -------------------------------------------------------------
        const mainSpatialGroup = new THREE.Group();
        mainSpatialGroupRef.current = mainSpatialGroup;
        mainSpatialGroup.visible = false;
        mainSpatialGroup.position.set(1.15, 0, 0);
        mainSpatialGroup.scale.set(spatialScaleRef.current, spatialScaleRef.current, spatialScaleRef.current);

        // 1. CENTER SLOT (0,0,0): 3D Business Card Base Box (ALWAYS VISIBLE AT 0,0,0)
        const createBusinessCardTexture = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 2048;
          canvas.height = 1152;
          const ctx = canvas.getContext("2d");

          const bgGrad = ctx.createLinearGradient(0, 0, 2048, 1152);
          bgGrad.addColorStop(0, "#07090D");
          bgGrad.addColorStop(0.5, "#141822");
          bgGrad.addColorStop(1, "#0B0E14");
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 2048, 1152);

          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 24;
          ctx.strokeRect(30, 30, 1988, 1092);

          ctx.strokeStyle = "#AA771C";
          ctx.lineWidth = 8;
          ctx.strokeRect(50, 50, 1948, 1052);

          const cornerSize = 100;
          const corners = [
            [70, 70], [1978 - cornerSize, 70],
            [70, 1082 - cornerSize], [1978 - cornerSize, 1082 - cornerSize]
          ];
          corners.forEach(([cx, cy]) => {
            ctx.strokeStyle = "#F3E5AB";
            ctx.lineWidth = 4;
            ctx.strokeRect(cx, cy, cornerSize, cornerSize);
          });

          ctx.fillStyle = "#D4AF37";
          ctx.fillRect(80, 80, 24, 992);

          ctx.fillStyle = "#141822";
          ctx.beginPath();
          ctx.arc(280, 380, 140, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 10;
          ctx.stroke();

          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 130px \"Playfair Display\", serif";
          ctx.textAlign = "center";
          ctx.fillText("MM", 280, 425);
          ctx.textAlign = "left";

          const textGrad = ctx.createLinearGradient(460, 200, 1800, 200);
          textGrad.addColorStop(0, "#FFF0CA");
          textGrad.addColorStop(0.5, "#D4AF37");
          textGrad.addColorStop(1, "#AA771C");
          ctx.fillStyle = textGrad;
          ctx.font = "bold 96px \"Playfair Display\", serif";
          ctx.fillText("MM INTERIORS VIZAG", 460, 260);

          ctx.fillStyle = "#F3E5AB";
          ctx.font = "bold 42px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("LUXURY ARCHITECTURAL INTERIORS & TURNKEY DESIGN", 460, 330);

          ctx.strokeStyle = "rgba(212, 175, 55, 0.6)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(460, 370);
          ctx.lineTo(1900, 370);
          ctx.stroke();

          ctx.fillStyle = "#E5E7EB";
          ctx.font = "500 32px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("• Architectural Planning  • 3D Virtual Rendering  • Modular Kitchens", 460, 430);
          ctx.fillText("• Luxury Master Suites    • Executive Lounges     • Lighting Automation", 460, 480);

          ctx.fillStyle = "rgba(212, 175, 55, 0.12)";
          ctx.fillRect(460, 530, 1440, 210);
          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 3;
          ctx.strokeRect(460, 530, 1440, 210);

          ctx.fillStyle = "#F3E5AB";
          ctx.font = "bold 34px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("🏆 Award-Winning Design Studio  |  ✨ 100% Turnkey Execution", 500, 590);

          ctx.fillStyle = "#D4AF37";
          ctx.font = "30px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("💎 Premium Italian Marbles & Veneers  |  ⚡ Smart Home Automation", 500, 680);

          ctx.fillStyle = "#0B0E14";
          ctx.fillRect(80, 820, 1820, 180);
          ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
          ctx.lineWidth = 3;
          ctx.strokeRect(80, 820, 1820, 180);

          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 34px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("📍 Siripuram, Visakhapatnam, AP  |  📞 +91 98765 43210  |  ✉ contact@mminteriorsvizag.com", 120, 890);

          ctx.fillStyle = "#F3E5AB";
          ctx.font = "bold 30px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("🌐 www.mminteriorsvizag.com  |  ✨ Tap 3D Portfolio Panel to Explore Designs", 120, 950);

          return new THREE.CanvasTexture(canvas);
        };

        const createCardBaseMesh = () => {
          const cardGeo = new THREE.BoxGeometry(3.8, 2.25, 0.08);
          const cardTexture = createBusinessCardTexture();

          const goldSideMat = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            metalness: 0.95,
            roughness: 0.15,
            emissive: 0x332200,
            emissiveIntensity: 0.35
          });

          const frontMat = new THREE.MeshStandardMaterial({
            map: cardTexture,
            roughness: 0.2,
            metalness: 0.4
          });

          const backMat = new THREE.MeshStandardMaterial({
            color: 0x0B0E14,
            metalness: 0.8,
            roughness: 0.3
          });

          const mesh = new THREE.Mesh(cardGeo, [goldSideMat, goldSideMat, goldSideMat, goldSideMat, frontMat, backMat]);
          mesh.position.set(0, 0, 0);
          mesh.scale.set(1.0, 1.0, 1.0);
          mesh.visible = true;
          mesh.name = "businessCardMesh";
          mesh.userData = { action: "cardMesh" };
          cardMeshRef.current = mesh;
          return mesh;
        };

        mainSpatialGroup.add(createCardBaseMesh());

        // 2. TOP-LEFT: 3D Extruded MM Monogram Logo (ALWAYS VISIBLE at -2.8, 1.1, 0.2)
        const createExtrudedMMLogo = () => {
          const mmGroup = new THREE.Group();
          const shape = new THREE.Shape();

          shape.moveTo(-1.8, -0.8);
          shape.lineTo(-1.8, 0.8);
          shape.lineTo(-1.2, -0.1);
          shape.lineTo(-0.6, 0.8);
          shape.lineTo(-0.6, -0.8);
          shape.lineTo(-1.0, -0.8);
          shape.lineTo(-1.0, 0.1);
          shape.lineTo(-1.2, -0.2);
          shape.lineTo(-1.4, 0.1);
          shape.lineTo(-1.4, -0.8);
          shape.closePath();

          shape.moveTo(0.2, -0.8);
          shape.lineTo(0.2, 0.8);
          shape.lineTo(0.8, -0.1);
          shape.lineTo(1.4, 0.8);
          shape.lineTo(1.4, -0.8);
          shape.lineTo(1.0, -0.8);
          shape.lineTo(1.0, 0.1);
          shape.lineTo(0.8, -0.2);
          shape.lineTo(0.6, 0.1);
          shape.lineTo(0.6, -0.8);
          shape.closePath();

          const geometry = new THREE.ExtrudeGeometry(shape, {
            steps: 2,
            depth: 0.35,
            bevelEnabled: true,
            bevelThickness: 0.08,
            bevelSize: 0.06,
            bevelSegments: 4
          });
          geometry.center();

          const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xD4AF37,
            metalness: 0.95,
            roughness: 0.12,
            emissive: 0x443300,
            emissiveIntensity: 0.25
          });

          const mmMesh = new THREE.Mesh(geometry, goldMaterial);
          mmMesh.name = "MMLogoMesh";
          mmGroup.add(mmMesh);

          mmGroup.position.set(-2.8, 1.1, 0.2);
          mmGroup.scale.set(0.7, 0.7, 0.7);
          mm3DGroupRef.current = mmGroup;
          return mmGroup;
        };

        mainSpatialGroup.add(createExtrudedMMLogo());

        // 3. TOP-CENTER: 3D Video Screen Showcase (ALWAYS VISIBLE directly above card: y = 2.05)
        const createVideoScreenMesh = () => {
          const videoGeo = new THREE.PlaneGeometry(3.2, 1.8);
          const initialMap = (videoElementRef.current && videoElementRef.current.readyState >= 2)
            ? videoTexture
            : fallbackTexture;

          const videoMat = new THREE.MeshBasicMaterial({ map: initialMap, side: THREE.DoubleSide });
          const videoMesh = new THREE.Mesh(videoGeo, videoMat);
          videoMesh.position.set(0, 0, 0.03);
          videoMesh.name = "videoMesh";
          videoMeshRef.current = videoMesh;

          const frameGeo = new THREE.BoxGeometry(3.32, 1.92, 0.04);
          const frameMat = new THREE.MeshStandardMaterial({
            color: 0x141822,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x221a00,
            emissiveIntensity: 0.3
          });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(0, 0, 0);

          const group = new THREE.Group();
          group.add(frameMesh);
          group.add(videoMesh);
          group.position.set(0, 2.05, 0.05);
          videoGroupRef.current = group;
          return group;
        };

        mainSpatialGroup.add(createVideoScreenMesh());

        // 4. RIGHT SIDE: Interactive 3D Tab Switcher Button Widget (ALWAYS VISIBLE at x = 2.25)
        const createPortfolioSlideButton = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 360;
          canvas.height = 100;
          const ctx = canvas.getContext("2d");
          slideBtnCanvasRef.current = canvas;

          ctx.fillStyle = "#141822";
          ctx.fillRect(0, 0, 360, 100);

          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 6;
          ctx.strokeRect(6, 6, 348, 88);

          ctx.fillStyle = "#F3E5AB";
          ctx.font = "bold 24px \"Plus Jakarta Sans\", sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("▶ SLIDE PORTFOLIO", 180, 60);

          const texture = new THREE.CanvasTexture(canvas);
          slideBtnTextureRef.current = texture;

          const geo = new THREE.PlaneGeometry(1.4, 0.42);
          const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(2.25, 0, 0.2);
          mesh.name = "portfolioSlideButtonMesh";
          mesh.userData = { action: "toggleView" };
          slideBtnMeshRef.current = mesh;

          const frameGeo = new THREE.BoxGeometry(1.44, 0.46, 0.04);
          const frameMat = new THREE.MeshStandardMaterial({ color: 0x0B0E14, metalness: 0.9, roughness: 0.2 });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(2.25, 0, 0.17);
          frameMesh.userData = { action: "toggleView" };

          const group = new THREE.Group();
          group.add(frameMesh);
          group.add(mesh);
          return group;
        };

        mainSpatialGroup.add(createPortfolioSlideButton());

        // 5. SLIDING PORTFOLIO SHOWCASE PANEL (Expanded Size: 4.8 x 2.7)
        const createPortfolioWebPanelMesh = () => {
          const portfolioCanvas = document.createElement("canvas");
          portfolioCanvas.width = 1920;
          portfolioCanvas.height = 1080;
          const portfolioCtx = portfolioCanvas.getContext("2d");
          portfolioCanvasRef.current = portfolioCanvas;
          portfolioCtxRef.current = portfolioCtx;

          const portfolioTexture = new THREE.CanvasTexture(portfolioCanvas);
          portfolioTextureRef.current = portfolioTexture;
          renderPortfolioWebCanvas();

          const webGeo = new THREE.PlaneGeometry(4.8, 2.7);
          const webMat = new THREE.MeshBasicMaterial({ map: portfolioTexture, side: THREE.DoubleSide });
          const portfolioWebMesh = new THREE.Mesh(webGeo, webMat);

          portfolioWebMesh.position.set(0, 0, 0.05);
          portfolioWebMesh.name = "portfolioWebMesh";
          portfolioWebMeshRef.current = portfolioWebMesh;

          const frameMat = new THREE.MeshStandardMaterial({
            color: 0x141822,
            metalness: 0.85,
            roughness: 0.2,
            emissive: 0x221a00,
            emissiveIntensity: 0.3
          });
          const webFrameGeo = new THREE.BoxGeometry(4.92, 2.82, 0.04);
          const webFrameMesh = new THREE.Mesh(webFrameGeo, frameMat);
          webFrameMesh.position.set(0, 0, 0);

          const group = new THREE.Group();
          group.add(webFrameMesh);
          group.add(portfolioWebMesh);

          // Initially tucked behind card (scale 0, visible false)
          group.position.set(2.25, 0.2, -0.1);
          group.scale.set(0, 0, 0);
          group.visible = false;
          portfolioGroupRef.current = group;
          return group;
        };

        mainSpatialGroup.add(createPortfolioWebPanelMesh());

        // 6. BOTTOM: 3D ACTION BUTTONS (ALWAYS VISIBLE directly below card: y = -1.45)
        const createActionButtonsGroup = () => {
          const actionGroup = new THREE.Group();
          actionMeshesRef.current = [];

          const actionItems = [
            { label: "📞 Call Us", url: "tel:+919876543210", x: -2.1, color: "#D4AF37" },
            { label: "💬 WhatsApp", url: "https://wa.me/919876543210?text=Hello%20MM%20Interiors%20Vizag,%20I%20would%20like%20to%20inquire%20about%20your%20interior%20services.", x: -0.7, color: "#25D366" },
            { label: "📅 Consultation", action: "consultation", x: 0.7, color: "#D4AF37" },
            { label: "🌐 Website", url: "https://www.mminteriorsvizag.com", x: 2.1, color: "#D4AF37" }
          ];

          actionItems.forEach((item) => {
            const canvas = document.createElement("canvas");
            canvas.width = 300;
            canvas.height = 90;
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#141822";
            ctx.fillRect(0, 0, 300, 90);
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 5;
            ctx.strokeRect(6, 6, 288, 78);

            ctx.fillStyle = item.color;
            ctx.font = "bold 26px \"Plus Jakarta Sans\", sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(item.label, 150, 54);

            const texture = new THREE.CanvasTexture(canvas);
            const geo = new THREE.PlaneGeometry(1.25, 0.38);
            const mat = new THREE.MeshBasicMaterial({ map: texture });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(item.x, -1.45, 0.12);
            mesh.name = `ActionMesh_${item.label}`;
            mesh.userData = item;

            const frameGeo = new THREE.BoxGeometry(1.29, 0.42, 0.02);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x0B0E14, metalness: 0.8, roughness: 0.2 });
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);
            frameMesh.position.set(item.x, -1.45, 0.1);

            const btnGroup = new THREE.Group();
            btnGroup.add(frameMesh);
            btnGroup.add(mesh);

            actionGroup.add(btnGroup);
            actionMeshesRef.current.push(mesh);
          });

          return actionGroup;
        };

        mainSpatialGroup.add(createActionButtonsGroup());

        // 7. AMBIENT GOLD PARTICLES
        const particleCount = 140;
        const pGeo = new THREE.BufferGeometry();
        const pPos = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
          pPos[i] = (Math.random() - 0.5) * 14;
          pPos[i + 1] = (Math.random() - 0.5) * 14;
          pPos[i + 2] = (Math.random() - 0.5) * 14;
        }
        pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
        const pMat = new THREE.PointsMaterial({ color: 0xD4AF37, size: 0.06, transparent: true, opacity: 0.7 });
        const particleSystem = new THREE.Points(pGeo, pMat);
        mainSpatialGroup.add(particleSystem);

        anchor.group.add(mainSpatialGroup);

        // RAYCASTER HANDLER
        const handlePointerDown = (event) => {
          if (!mouseRef.current || !raycasterRef.current || !cameraRef.current) return;

          // Ignore touches on UI overlay elements (like floating HTML buttons)
          if (event.target && event.target.closest && event.target.closest("button")) {
            return;
          }

          mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

          // Only raycast against active, visible objects whose parent group is visible
          const candidateObjects = [
            slideBtnMeshRef.current,
            portfolioGroupRef.current && portfolioGroupRef.current.visible ? portfolioWebMeshRef.current : null,
            videoMeshRef.current,
            mm3DGroupRef.current,
            cardMeshRef.current,
            ...actionMeshesRef.current
          ].filter((obj) => obj && obj.visible && (!obj.parent || obj.parent.visible));

          const intersects = raycasterRef.current.intersectObjects(candidateObjects, true);

          if (intersects.length > 0) {
            const hit = intersects[0];
            const hitMesh = hit.object;

            let isSlideToggleHit = false;
            let currentObj = hitMesh;
            while (currentObj) {
              if (
                currentObj === slideBtnMeshRef.current ||
                currentObj.name === "portfolioSlideButtonMesh" ||
                (currentObj.userData && currentObj.userData.action === "toggleView")
              ) {
                isSlideToggleHit = true;
                break;
              }
              currentObj = currentObj.parent;
            }

            if (isSlideToggleHit) {
              togglePortfolioSlide(event);
            } else if (hitMesh === portfolioWebMeshRef.current && hit.uv) {
              const tapY = 1.0 - hit.uv.y;
              const uvX = hit.uv.x;

              if (tapY >= 0.12 && tapY <= 0.25) {
                let cat = "Living Room";
                if (uvX < 0.25) cat = "Living Room";
                else if (uvX >= 0.25 && uvX < 0.50) cat = "Kitchen";
                else if (uvX >= 0.50 && uvX < 0.75) cat = "Bedroom";
                else cat = "Commercial";

                setSelectedCategory(cat);
                triggerToast("Portfolio View: " + cat);
              } else if (tapY >= 0.82) {
                setShowConsultModal(true);
              }
            } else if (hitMesh.name === "MMLogoMesh" || (mm3DGroupRef.current && (hitMesh === mm3DGroupRef.current || hitMesh.parent === mm3DGroupRef.current))) {
              triggerMMLogoElevation();
            } else if (hitMesh === videoMeshRef.current || (videoGroupRef.current && hitMesh.parent === videoGroupRef.current)) {
              if (videoElementRef.current) {
                if (videoElementRef.current.paused) {
                  videoElementRef.current.play();
                  triggerToast("▶ Playing Interior Video");
                } else {
                  videoElementRef.current.pause();
                  triggerToast("⏸ Paused Video");
                }
              }
            } else if (hitMesh.userData && hitMesh.userData.action === "consultation") {
              console.log("[Raycaster] Consultation Button Clicked");
              setShowConsultModal(true);
            } else if (hitMesh.userData && hitMesh.userData.url) {
              console.log("[Raycaster] Opening External URL:", hitMesh.userData.url);
              window.open(hitMesh.userData.url, "_blank");
            }
          }
        };

        window.addEventListener("pointerdown", handlePointerDown);

        // PINCH-TO-ZOOM & MOUSE WHEEL ZOOM GESTURES
        const handleTouchStart = (e) => {
          if (e.touches.length === 2) {
            const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            initialPinchDistRef.current = dist;
            initialScaleRef.current = spatialScaleRef.current;
          }
        };

        const handleTouchMove = (e) => {
          if (e.touches.length === 2 && initialPinchDistRef.current > 0) {
            const currentDist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
            );
            const factor = currentDist / initialPinchDistRef.current;
            const newScale = Math.min(Math.max(initialScaleRef.current * factor, 0.15), 1.2);
            spatialScaleRef.current = newScale;
            if (mainSpatialGroupRef.current) {
              mainSpatialGroupRef.current.scale.set(newScale, newScale, newScale);
            }
          }
        };

        const handleTouchEnd = (e) => {
          if (e.touches.length < 2) {
            initialPinchDistRef.current = 0;
          }
        };

        const handleWheel = (e) => {
          const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
          const newScale = Math.min(Math.max(spatialScaleRef.current * zoomFactor, 0.15), 1.2);
          spatialScaleRef.current = newScale;
          if (mainSpatialGroupRef.current) {
            mainSpatialGroupRef.current.scale.set(newScale, newScale, newScale);
          }
        };

        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: true });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        window.addEventListener("wheel", handleWheel, { passive: true });

        console.log("🎥 [MindAR] Starting Camera Feed...");
        await mindarThree.start();
        console.log("✅ [MindAR] Camera Feed Active!");
        setArStarted(true);

        // MAIN ANIMATION LOOP
        renderer.setAnimationLoop(() => {
          if (mm3DGroupRef.current) {
            mm3DGroupRef.current.rotation.y += 0.008;
          }
          if (particleSystem) {
            particleSystem.rotation.y += 0.0006;
          }
          if (dirLightRef.current) {
            dirLightRef.current.intensity = 2.0 + Math.sin(Date.now() * 0.003) * 0.4;
          }

          // Smart texture swap for video plane
          if (videoMeshRef.current && videoElementRef.current) {
            const video = videoElementRef.current;
            if (video.readyState >= 2 && !video.paused) {
              if (videoMeshRef.current.material.map !== videoTextureRef.current) {
                videoMeshRef.current.material.map = videoTextureRef.current;
                videoMeshRef.current.material.needsUpdate = true;
              }
              if (videoTextureRef.current) {
                videoTextureRef.current.needsUpdate = true;
              }
            } else {
              if (videoMeshRef.current.material.map !== fallbackVideoTextureRef.current) {
                videoMeshRef.current.material.map = fallbackVideoTextureRef.current;
                videoMeshRef.current.material.needsUpdate = true;
              }
            }
          }

          renderer.render(scene, camera);
        });

      } catch (err) {
        console.error("❌ [MindAR Error] Engine start error:", err);
        setErrorMessage("Camera access or WebAR engine failed. Please grant camera permission and refresh.");
      }
    };

    initAR();

    return () => {
      console.log("🧹 [Cleanup] Stopping MindAR camera stream...");
      if (mindarRef.current) {
        mindarRef.current.stop();
      }
    };
  }, []);

  // ULTRA-PREMIUM 3D SLIDE ENTRANCE ANIMATION SEQUENCE
  const animatePremiumSlideEntrance = () => {
    console.log("✨ [GSAP Animation] Triggering Ultra-Premium 3D Spatial Slide Entrance Sequence");

    const targetX = isPortfolioSlidOutRef.current ? -0.3 : 1.15;
    if (mainSpatialGroupRef.current) {
      gsap.fromTo(
        mainSpatialGroupRef.current.position,
        { x: 5.0, y: 0, z: 0 },
        { x: targetX, y: 0, z: 0, duration: 1.0, ease: "power3.out" }
      );
    }

    if (mm3DGroupRef.current) {
      gsap.fromTo(
        mm3DGroupRef.current.position,
        { x: -5.0, y: 1.1, z: 0.2 },
        { x: -2.8, y: 1.1, z: 0.2, duration: 1.0, ease: "power3.out" }
      );
      gsap.fromTo(
        mm3DGroupRef.current.rotation,
        { y: -Math.PI * 2 },
        { y: 0, duration: 1.0, ease: "power3.out" }
      );
    }

    if (videoGroupRef.current) {
      videoGroupRef.current.visible = true;
      videoGroupRef.current.position.set(0, 2.05, 0.05);
      gsap.fromTo(
        videoGroupRef.current.position,
        { x: 0, y: 5.0, z: 0.05 },
        { x: 0, y: 2.05, z: 0.05, duration: 0.9, ease: "back.out(1.4)", delay: 0.1 }
      );
    }

    // Business Card is ALWAYS ACTIVE at (0,0,0)
    if (cardMeshRef.current) {
      cardMeshRef.current.visible = true;
      cardMeshRef.current.position.set(0, 0, 0);
      cardMeshRef.current.scale.set(1.0, 1.0, 1.0);
      cardMeshRef.current.rotation.set(0, 0, 0);
      gsap.fromTo(
        cardMeshRef.current.position,
        { z: -1.5 },
        { z: 0, duration: 0.9, ease: "power2.out" }
      );
    }

    // Preserve Portfolio state if already slid out, otherwise tuck behind card
    if (portfolioGroupRef.current) {
      if (isPortfolioSlidOutRef.current) {
        portfolioGroupRef.current.visible = true;
        portfolioGroupRef.current.position.set(2.7, 0.0, 0.15);
        portfolioGroupRef.current.scale.set(1.05, 1.05, 1.05);
      } else {
        portfolioGroupRef.current.visible = false;
        portfolioGroupRef.current.position.set(2.25, 0.0, -0.1);
        portfolioGroupRef.current.scale.set(0, 0, 0);
        portfolioGroupRef.current.rotation.set(0, 0, 0);
      }
    }

    if (slideBtnCanvasRef.current && slideBtnTextureRef.current) {
      const isSlidOut = isPortfolioSlidOutRef.current;
      const ctx = slideBtnCanvasRef.current.getContext("2d");
      ctx.fillStyle = isSlidOut ? "#D4AF37" : "#141822";
      ctx.fillRect(0, 0, 360, 100);
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 348, 88);
      ctx.fillStyle = isSlidOut ? "#07090D" : "#F3E5AB";
      ctx.font = "bold 24px \"Plus Jakarta Sans\", sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(isSlidOut ? "◀ HIDE PORTFOLIO" : "▶ SLIDE PORTFOLIO", 180, 60);
      slideBtnTextureRef.current.needsUpdate = true;
    }
  };

  const triggerMMLogoElevation = () => {
    if (!mm3DGroupRef.current) return;
    triggerToast("✨ 3D MM Logo Monogram Elevation");
    const group = mm3DGroupRef.current;

    const tl = gsap.timeline();
    tl.to(group.position, { z: 1.8, y: 1.4, duration: 1.0, ease: "back.out(1.7)" })
      .to(group.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 1.0, ease: "back.out(1.7)" }, "<")
      .to(group.position, { x: -2.8, y: 1.1, z: 0.2, duration: 0.8, ease: "power3.out" })
      .to(group.scale, { x: 0.7, y: 0.7, z: 0.7, duration: 0.8, ease: "power3.out" }, "<");
  };

  const handleZoom = (direction) => {
    const factor = direction === "in" ? 1.15 : 0.85;
    const newScale = Math.min(Math.max(spatialScaleRef.current * factor, 0.15), 1.2);
    spatialScaleRef.current = newScale;
    if (mainSpatialGroupRef.current) {
      mainSpatialGroupRef.current.scale.set(newScale, newScale, newScale);
    }
    triggerToast(`🔍 Spatial Zoom: ${Math.round(newScale * 100)}%`);
  };

  const resetZoom = () => {
    spatialScaleRef.current = 0.38;
    if (mainSpatialGroupRef.current) {
      mainSpatialGroupRef.current.scale.set(0.38, 0.38, 0.38);
    }
    triggerToast("🔄 Zoom Level Reset");
  };

  const handleConsultSubmit = (e) => {
    e.preventDefault();
    console.log("📋 [Form Submitted] Consultation request received");
    setShowConsultModal(false);
    triggerToast("Consultation Request Received! MM Interiors Vizag will contact you.");
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none">
      {/* MindAR Camera Feed Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0"></div>

      {/* FLOATING SLIDE PORTFOLIO OVERLAY BUTTON */}
      {arStarted && targetFound && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 glass-panel p-1.5 rounded-full border-gold-500/60 shadow-2xl">
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              togglePortfolioSlide(e);
            }}
            className={`px-5 py-2 rounded-full font-bold text-xs tracking-wider transition-all ${
              isPortfolioSlidOut
                ? "gold-btn shadow-lg"
                : "bg-charcoal-900 text-gold-300 border border-gold-500/40 hover:bg-gold-500 hover:text-charcoal-950"
            }`}
          >
            {isPortfolioSlidOut ? "◀ Hide Portfolio" : "▶ Slide Out Portfolio"}
          </button>
        </div>
      )}

      {/* FLOATING ZOOM CONTROLS FOR PHONE TOUCH & DESKTOP */}
      {arStarted && targetFound && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
          <button
            onClick={() => handleZoom("in")}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-gold-500 font-bold text-lg shadow-2xl active:scale-90 transition-transform"
            title="Zoom In 3D Scene"
          >
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </button>
          <button
            onClick={() => handleZoom("out")}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-gold-500 font-bold text-lg shadow-2xl active:scale-90 transition-transform"
            title="Zoom Out 3D Scene"
          >
            <i className="fa-solid fa-magnifying-glass-minus"></i>
          </button>
          <button
            onClick={resetZoom}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-gold-500 font-bold text-xs shadow-2xl active:scale-90 transition-transform"
            title="Reset Zoom"
          >
            <i className="fa-solid fa-rotate-left"></i>
          </button>
        </div>
      )}

      {/* CONSULTATION FORM MODAL */}
      {showConsultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-5">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border-gold-500/60 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex justify-between items-center border-b border-gold-500/20 pb-3">
              <h3 className="font-serif font-bold text-xl text-gold-500">Book Interior Consultation</h3>
              <button onClick={() => setShowConsultModal(false)} className="text-gray-400 hover:text-white">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleConsultSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gold-300 font-semibold mb-1 block">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  className="w-full bg-charcoal-900 border border-gold-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="text-xs text-gold-300 font-semibold mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="w-full bg-charcoal-900 border border-gold-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                />
              </div>
              <div>
                <label className="text-xs text-gold-300 font-semibold mb-1 block">Design Interest</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-charcoal-900 border border-gold-500/30 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500"
                >
                  <option value="Living Room">Living Room Design</option>
                  <option value="Kitchen">Modular Kitchen</option>
                  <option value="Bedroom">Master Bedroom Suite</option>
                  <option value="Commercial">Commercial / Executive Lounge</option>
                </select>
              </div>
              <button
                type="submit"
                className="gold-btn py-3 rounded-xl font-bold text-xs uppercase tracking-wider mt-3 shadow-lg"
              >
                Submit Consultation Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ERROR FALLBACK OVERLAY */}
      {errorMessage && (
        <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="glass-panel p-8 rounded-3xl max-w-sm flex flex-col items-center gap-4 border-red-500/60 shadow-2xl">
            <i className="fa-solid fa-triangle-exclamation text-red-500 text-3xl"></i>
            <p className="text-sm font-medium text-gray-200">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="gold-btn px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider mt-2 shadow-lg"
            >
              Grant Camera Access & Retry
            </button>
          </div>
        </div>
      )}

      {/* CAMERA SCANNING GUIDANCE OVERLAY (Only visible when scanning, before target detected) */}
      {arStarted && !targetFound && !errorMessage && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center p-6">
          <div className="ar-scanner-frame relative w-80 h-[460px] rounded-2xl border-2 border-gold-500/80 flex flex-col justify-between p-4 opacity-80">
            <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-gold-500 rounded-tl-md"></div>
            <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-gold-500 rounded-tr-md"></div>
            <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-gold-500 rounded-bl-md"></div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-gold-500 rounded-br-md"></div>

            <div className="text-center text-[11px] tracking-widest text-gold-300 font-bold uppercase bg-charcoal-950/80 py-1.5 px-3 rounded-full mx-auto backdrop-blur-md border border-gold-500/30">
              <i className="fa-solid fa-expand mr-1.5 animate-pulse text-gold-500"></i> Point camera at business card
            </div>

            <div className="text-center text-[11px] text-gray-300 bg-charcoal-950/80 py-1 px-3 rounded-md mx-auto backdrop-blur-md border border-white/10">
              Align MM Business Card within frame
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      <div
        className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
          showToast ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="glass-panel px-5 py-2.5 rounded-full text-xs font-semibold text-gold-300 flex items-center gap-2 shadow-xl border-gold-500/50">
          <i className="fa-solid fa-sparkles text-gold-500"></i>
          <span>{toastMsg}</span>
        </div>
      </div>
    </div>
  );
}

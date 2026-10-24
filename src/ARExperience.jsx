import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import gsap from "gsap";

const portfolioData = {
  "Living Room": {
    title: "Royal Living Suite",
    location: "Siripuram, Vizag",
    desc: "Italian Statuario marble flooring, custom brass accent inlays, motorized cove lighting, and acoustic oak wood paneling."
  },
  "Kitchen": {
    title: "Minimalist Kitchen",
    location: "Beach Road, Vizag",
    desc: "Calacatta Gold Quartz countertops, handleless touch-to-open acrylic cabinets, and concealed smart appliances."
  },
  "Bedroom": {
    title: "Master Sanctuary",
    location: "MVP Colony, Vizag",
    desc: "Smoked oak veneer wall paneling, hand-tufted acoustic velvet headboard, and automated glass wardrobe lighting."
  },
  "Commercial": {
    title: "Executive Lounge",
    location: "Tech Park, Vizag",
    desc: "Bespoke 16-seater boardroom acoustics, Italian full-grain leather finishes, and dynamic brand logo LED lighting."
  }
};

export default function ARExperience() {
  const containerRef = useRef(null);
  const [arStarted, setArStarted] = useState(false);
  const [targetFound, setTargetFound] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Living Room");
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);

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
  const selectedCategoryRef = useRef("Living Room");
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const portfolioWebMeshRef = useRef(null);
  const videoMeshRef = useRef(null);
  const actionMeshesRef = useRef([]);
  const dirLightRef = useRef(null);

  // Pinch Zoom Gesture References
  const initialPinchDistRef = useRef(0);
  const initialScaleRef = useRef(0.42);
  const spatialScaleRef = useRef(0.42);

  const triggerToast = (msg) => {
    console.log(`[AR Notification]: ${msg}`);
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
    if (portfolioCtxRef.current && portfolioTextureRef.current) {
      renderPortfolioWebCanvas();
    }
  }, [selectedCategory]);

  // Robust Local Interior Video Texture Setup (Never Blank!)
  const initRobustVideoTexture = () => {
    console.log("🎬 [Video Source] Initializing robust 3D Video Stream...");

    // Create DOM-attached hidden video element
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
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

    // Try playing local video
    video.load();
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log("✅ [Video Stream] /video.mp4 playing successfully!");
        })
        .catch((err) => {
          console.warn("⚠️ [Video Stream] Video play pending interaction, fallback ready:", err);
        });
    }

    return videoTexture;
  };

  // Render Portfolio Web Canvas (1080 x 960)
  const renderPortfolioWebCanvas = () => {
    const canvas = portfolioCanvasRef.current;
    const ctx = portfolioCtxRef.current;
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const category = selectedCategoryRef.current;

    // Background Panel
    ctx.fillStyle = "#141822";
    ctx.fillRect(0, 0, width, height);

    // Header Banner
    ctx.fillStyle = "#0B0E14";
    ctx.fillRect(0, 0, width, 120);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 36px \"Playfair Display\", serif";
    ctx.fillText("MM Interiors Portfolio Web Showcase", 40, 60);

    ctx.fillStyle = "#A0A5B5";
    ctx.font = "20px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("Interactive WebAR Architectural Portfolio • Vizag Studio", 40, 98);

    // CATEGORY FILTER TABS
    const categories = ["Living Room", "Kitchen", "Bedroom", "Commercial"];
    const tabWidth = 220;
    const tabHeight = 52;
    const startX = 40;
    const startY = 145;

    categories.forEach((cat, index) => {
      const x = startX + index * (tabWidth + 18);
      const isSelected = cat === category;

      ctx.fillStyle = isSelected ? "#D4AF37" : "rgba(255, 255, 255, 0.08)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, startY, tabWidth, tabHeight, 14);
      else ctx.rect(x, startY, tabWidth, tabHeight);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = "#F3E5AB";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.fillStyle = isSelected ? "#07090D" : "#D4AF37";
      ctx.font = "bold 18px \"Plus Jakarta Sans\", sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(cat, x + tabWidth / 2, startY + 33);
    });

    ctx.textAlign = "left";

    const currentData = portfolioData[category] || portfolioData["Living Room"];

    // FEATURED PROJECT DISPLAY CARD
    ctx.fillStyle = "#0B0E14";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(40, 225, width - 80, 420, 24);
    else ctx.rect(40, 225, width - 80, 420);
    ctx.fill();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const grad = ctx.createLinearGradient(40, 225, width - 80, 645);
    grad.addColorStop(0, "#141822");
    grad.addColorStop(1, "#0B0E14");
    ctx.fillStyle = grad;
    ctx.fillRect(44, 229, width - 88, 412);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 28px \"Playfair Display\", serif";
    ctx.fillText("FEATURED DESIGN SHOWCASE", 70, 285);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 40px \"Playfair Display\", serif";
    ctx.fillText(currentData.title, 70, 345);

    ctx.fillStyle = "#D4AF37";
    ctx.font = "600 22px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("📍 " + currentData.location, 70, 390);

    ctx.fillStyle = "#D1D5DB";
    ctx.font = "22px \"Plus Jakarta Sans\", sans-serif";
    const words = currentData.desc.split(" ");
    let line = "";
    let y = 445;
    words.forEach((w) => {
      const test = line + w + " ";
      if (ctx.measureText(test).width > 860) {
        ctx.fillText(line, 70, y);
        line = w + " ";
        y += 34;
      } else {
        line = test;
      }
    });
    ctx.fillText(line, 70, y);

    // Handover Badge Box
    ctx.fillStyle = "rgba(212, 175, 55, 0.2)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(70, 525, 320, 52, 12);
    else ctx.rect(70, 525, 320, 52);
    ctx.fill();
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#D4AF37";
    ctx.font = "bold 20px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("✨ 100% Turnkey Handover Studio", 85, 558);

    // WIDER BOTTOM BUTTON IN 3D WEB PANEL
    ctx.fillStyle = "#D4AF37";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(40, 680, width - 80, 85, 20);
    else ctx.rect(40, 680, width - 80, 85);
    ctx.fill();

    ctx.fillStyle = "#07090D";
    ctx.font = "bold 26px \"Plus Jakarta Sans\", sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tap Here to Consult for " + category, width / 2, 732);

    ctx.fillStyle = "#A0A5B5";
    ctx.font = "17px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("MM Interiors Vizag • Tap tabs above to switch 3D portfolio views", width / 2, 825);

    if (portfolioTextureRef.current) {
      portfolioTextureRef.current.needsUpdate = true;
    }
  };

  useEffect(() => {
    let mindarThree = null;

    const initAR = async () => {
      console.log("==================================================");
      console.log("🚀 [WebAR Visit] INITIALIZING ROBUST WEBAR ENGINE");
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
        const videoTexture = initRobustVideoTexture();

        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: "/card.mind",
          filterMinCF: 0.0001,
          filterBeta: 0.001,
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

        anchor.onTargetFound = () => {
          console.log("🎯🎯🎯 [MindAR EVENT] TARGET FOUND!");
          setTargetFound(true);
          if (mainSpatialGroupRef.current) mainSpatialGroupRef.current.visible = true;

          // Ensure video plays on target scan
          if (videoElementRef.current) {
            videoElementRef.current.play().catch(() => {});
          }

          triggerToast("✨ MM Business Card Scanned!");
          animatePremiumSlideEntrance();
        };

        anchor.onTargetLost = () => {
          console.log("⚠️ [MindAR EVENT] TARGET LOST!");
          setTargetFound(false);
          if (mainSpatialGroupRef.current) mainSpatialGroupRef.current.visible = false;
        };

        // -------------------------------------------------------------
        // SPATIAL 3D COMPOSITION
        // -------------------------------------------------------------
        const mainSpatialGroup = new THREE.Group();
        mainSpatialGroupRef.current = mainSpatialGroup;
        mainSpatialGroup.visible = false;
        mainSpatialGroup.scale.set(spatialScaleRef.current, spatialScaleRef.current, spatialScaleRef.current);

        // 1. CENTER: 3D Business Card Base Box
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
          cardMeshRef.current = mesh;
          return mesh;
        };

        mainSpatialGroup.add(createCardBaseMesh());

        // 2. LEFT SIDE: 3D Extruded MM Monogram Logo
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

          mmGroup.position.set(-2.8, 0, 0.3);
          mmGroup.scale.set(0.85, 0.85, 0.85);
          mm3DGroupRef.current = mmGroup;
          return mmGroup;
        };

        mainSpatialGroup.add(createExtrudedMMLogo());

        // 3. MIDDLE TOP: 3D Video Screen Plane
        const createVideoScreenMesh = () => {
          const videoGeo = new THREE.PlaneGeometry(3.2, 1.8);
          const videoMat = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
          const videoMesh = new THREE.Mesh(videoGeo, videoMat);
          videoMesh.position.set(0, 2.2, 0.1);
          videoMesh.name = "videoMesh";
          videoMeshRef.current = videoMesh;

          const frameGeo = new THREE.BoxGeometry(3.32, 1.92, 0.05);
          const frameMat = new THREE.MeshStandardMaterial({
            color: 0x141822,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x221a00,
            emissiveIntensity: 0.3
          });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(0, 2.2, 0.05);

          const group = new THREE.Group();
          group.add(frameMesh);
          group.add(videoMesh);
          videoGroupRef.current = group;
          return group;
        };

        mainSpatialGroup.add(createVideoScreenMesh());

        // 4. RIGHT SIDE: 3D AR Portfolio Web Panel (Moved somewhat right to x = 4.2!)
        const createPortfolioWebPanelMesh = () => {
          const portfolioCanvas = document.createElement("canvas");
          portfolioCanvas.width = 1080;
          portfolioCanvas.height = 960;
          const portfolioCtx = portfolioCanvas.getContext("2d");
          portfolioCanvasRef.current = portfolioCanvas;
          portfolioCtxRef.current = portfolioCtx;

          const portfolioTexture = new THREE.CanvasTexture(portfolioCanvas);
          portfolioTextureRef.current = portfolioTexture;
          renderPortfolioWebCanvas();

          const webGeo = new THREE.PlaneGeometry(3.6, 3.3);
          const webMat = new THREE.MeshBasicMaterial({ map: portfolioTexture, side: THREE.DoubleSide });
          const portfolioWebMesh = new THREE.Mesh(webGeo, webMat);

          // MOVED SOMEWHAT RIGHT: x = 4.2 (was 3.4)!
          portfolioWebMesh.position.set(4.2, 0.5, 0.1);
          portfolioWebMesh.rotation.y = -Math.PI / 12;
          portfolioWebMesh.name = "portfolioWebMesh";
          portfolioWebMeshRef.current = portfolioWebMesh;

          const frameMat = new THREE.MeshStandardMaterial({
            color: 0x141822,
            metalness: 0.85,
            roughness: 0.2,
            emissive: 0x221a00,
            emissiveIntensity: 0.3
          });
          const webFrameGeo = new THREE.BoxGeometry(3.7, 3.4, 0.04);
          const webFrameMesh = new THREE.Mesh(webFrameGeo, frameMat);
          webFrameMesh.position.set(4.2, 0.5, 0.05);
          webFrameMesh.rotation.y = -Math.PI / 12;

          const group = new THREE.Group();
          group.add(webFrameMesh);
          group.add(portfolioWebMesh);
          portfolioGroupRef.current = group;
          return group;
        };

        mainSpatialGroup.add(createPortfolioWebPanelMesh());

        // 5. BOTTOM 3D ACTION BUTTONS
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
            mesh.position.set(item.x, -1.8, 0.2);
            mesh.name = `ActionMesh_${item.label}`;
            mesh.userData = item;

            const frameGeo = new THREE.BoxGeometry(1.29, 0.42, 0.02);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x0B0E14, metalness: 0.8, roughness: 0.2 });
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);
            frameMesh.position.set(item.x, -1.8, 0.18);

            const btnGroup = new THREE.Group();
            btnGroup.add(frameMesh);
            btnGroup.add(mesh);

            actionGroup.add(btnGroup);
            actionMeshesRef.current.push(mesh);
          });

          return actionGroup;
        };

        mainSpatialGroup.add(createActionButtonsGroup());

        // 6. AMBIENT GOLD PARTICLES
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
          mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

          const intersects = raycasterRef.current.intersectObjects([
            portfolioWebMeshRef.current,
            videoMeshRef.current,
            mm3DGroupRef.current,
            ...actionMeshesRef.current
          ].filter(Boolean), true);

          if (intersects.length > 0) {
            const hit = intersects[0];
            const hitMesh = hit.object;

            if (hitMesh === portfolioWebMeshRef.current && hit.uv) {
              const tapY = 1.0 - hit.uv.y;
              const uvX = hit.uv.x;

              if (tapY >= 0.15 && tapY <= 0.22) {
                let cat = "Living Room";
                if (uvX < 0.25) cat = "Living Room";
                else if (uvX >= 0.25 && uvX < 0.50) cat = "Kitchen";
                else if (uvX >= 0.50 && uvX < 0.75) cat = "Bedroom";
                else cat = "Commercial";

                setSelectedCategory(cat);
                triggerToast("Portfolio View: " + cat);
              } else if (tapY >= 0.70 && tapY <= 0.82) {
                setShowConsultModal(true);
              }
            } else if (hitMesh.name === "MMLogoMesh" || (mm3DGroupRef.current && (hitMesh === mm3DGroupRef.current || hitMesh.parent === mm3DGroupRef.current))) {
              triggerMMLogoElevation();
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
          // Update Video Texture continuously
          if (videoTextureRef.current) {
            videoTextureRef.current.needsUpdate = true;
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

    if (mm3DGroupRef.current) {
      gsap.fromTo(
        mm3DGroupRef.current.position,
        { x: -6.0, y: 0, z: 0.3 },
        { x: -2.6, y: 0, z: 0.3, duration: 1.2, ease: "power3.out" }
      );
      gsap.fromTo(
        mm3DGroupRef.current.rotation,
        { y: -Math.PI * 2 },
        { y: 0, duration: 1.2, ease: "power3.out" }
      );
    }

    if (videoGroupRef.current) {
      gsap.fromTo(
        videoGroupRef.current.position,
        { x: 0, y: 6.0, z: 0.1 },
        { x: 0, y: 0, z: 0, duration: 1.1, ease: "back.out(1.4)", delay: 0.1 }
      );
    }

    if (portfolioGroupRef.current) {
      gsap.fromTo(
        portfolioGroupRef.current.position,
        { x: 7.5, y: 0.5, z: 0.1 },
        { x: 0, y: 0, z: 0, duration: 1.2, ease: "power3.out", delay: 0.2 }
      );
    }

    if (cardMeshRef.current) {
      gsap.fromTo(
        cardMeshRef.current.position,
        { z: -1.5 },
        { z: 0, duration: 1.0, ease: "power2.out" }
      );
    }
  };

  const triggerMMLogoElevation = () => {
    if (!mm3DGroupRef.current) return;
    triggerToast("✨ 3D MM Logo Monogram Elevation");
    const group = mm3DGroupRef.current;

    const tl = gsap.timeline();
    tl.to(group.position, { z: 1.8, y: 0.3, duration: 1.0, ease: "back.out(1.7)" })
      .to(group.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 1.0, ease: "back.out(1.7)" }, "<")
      .to(group.position, { x: -2.6, y: 0, z: 0.3, duration: 0.8, ease: "power3.out" })
      .to(group.scale, { x: 0.85, y: 0.85, z: 0.85, duration: 0.8, ease: "power3.out" }, "<");
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
    spatialScaleRef.current = 0.42;
    if (mainSpatialGroupRef.current) {
      mainSpatialGroupRef.current.scale.set(0.42, 0.42, 0.42);
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

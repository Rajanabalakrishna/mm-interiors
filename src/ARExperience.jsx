import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { MindARThree } from "mind-ar/dist/mindar-image-three.prod.js";
import gsap from "gsap";

const portfolioProjects = [
  {
    id: "living",
    title: "Royal Living Suite",
    category: "Living Room",
    location: "Siripuram, Vizag",
    desc: "Italian Statuario marble flooring, custom brass accent inlays, motorized ambient cove lighting, and acoustic oak wood paneling.",
    specs: ["1,200 sq.ft", "Turnkey Handover", "Custom Lighting"],
    color: "#D4AF37"
  },
  {
    id: "kitchen",
    title: "Minimalist Kitchen",
    category: "Kitchen",
    location: "Beach Road, Vizag",
    desc: "Calacatta Gold Quartz countertops, handleless touch-to-open acrylic cabinets, and concealed Bosch smart appliances.",
    specs: ["German Hardware", "Anti-Scratch", "Smart Automation"],
    color: "#C5A059"
  },
  {
    id: "bedroom",
    title: "Master Sanctuary",
    category: "Bedroom",
    location: "MVP Colony, Vizag",
    desc: "Smoked oak veneer wall paneling, hand-tufted acoustic velvet headboard, and automated glass wardrobe lighting.",
    specs: ["King Suite", "Acoustic Softness", "Walk-in Closet"],
    color: "#AA771C"
  },
  {
    id: "commercial",
    title: "Executive Lounge",
    category: "Commercial",
    location: "Tech Park, Vizag",
    desc: "Bespoke 16-seater boardroom acoustics, Italian full-grain leather finishes, and dynamic brand logo LED lighting.",
    specs: ["2,400 sq.ft", "Acoustic Baffles", "Executive Suite"],
    color: "#F3E5AB"
  }
];

export default function ARExperience() {
  const containerRef = useRef(null);
  const [arStarted, setArStarted] = useState(false);
  const [targetFound, setTargetFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  // References
  const mindarRef = useRef(null);
  const videoElementRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const anchorGroupRef = useRef(null);
  const mainSpatialGroupRef = useRef(null);
  const mmLogoGroupRef = useRef(null);
  const fanGroupRef = useRef(null);
  const detailPanelRef = useRef(null);
  const projectMeshesRef = useRef([]);
  const detailMeshRef = useRef(null);
  const backBtnMeshRef = useRef(null);
  const videoMeshRef = useRef(null);
  const socialMeshesRef = useRef([]);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const portfolioCanvasRef = useRef(null);
  const portfolioTextureRef = useRef(null);
  const portfolioCtxRef = useRef(null);

  const triggerToast = (msg) => {
    console.log(`[AR Notification]: ${msg}`);
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  useEffect(() => {
    let mindarThree = null;

    const initAR = async () => {
      console.log("==================================================");
      console.log("🚀 [WebAR Visit] INITIALIZING STABLE WEBAR ENGINE");
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
        // Video Source
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.src = "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-with-luxurious-decoration-40332-large.mp4";
        video.load();
        video.play().catch(() => {});
        videoElementRef.current = video;

        const videoTexture = new THREE.VideoTexture(video);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;

        // MindAR Engine with Strong Motion Dampening (filterMinCF & filterBeta)
        mindarThree = new MindARThree({
          container: containerRef.current,
          imageTargetSrc: "/card.mind",
          filterMinCF: 0.00001, // Extra stable jitter reduction
          filterBeta: 0.0001,  // Smooth motion tracking
          uiLoading: "no",
          uiScanning: "no",
          uiError: "no"
        });

        mindarRef.current = mindarThree;
        const { renderer, scene, camera } = mindarThree;
        sceneRef.current = scene;
        cameraRef.current = camera;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xD4AF37, 2.2);
        dirLight.position.set(2, 4, 3);
        scene.add(dirLight);

        // TARGET ANCHOR 0
        const anchor = mindarThree.addAnchor(0);
        anchorGroupRef.current = anchor.group;

        anchor.onTargetFound = () => {
          console.log("🎯🎯🎯 [MindAR EVENT] TARGET FOUND!");
          setTargetFound(true);
          if (mainSpatialGroupRef.current) mainSpatialGroupRef.current.visible = true;
          triggerToast("🎯 MM Business Card Scanned!");
          animateEntrance();
        };

        anchor.onTargetLost = () => {
          console.log("⚠️ [MindAR EVENT] TARGET LOST!");
          setTargetFound(false);
          if (mainSpatialGroupRef.current) mainSpatialGroupRef.current.visible = false;
        };

        // -------------------------------------------------------------
        // COMPACT & ULTRA-STABLE 3D SPATIAL UI (1.0 = Width of Card)
        // -------------------------------------------------------------
        const mainSpatialGroup = new THREE.Group();
        mainSpatialGroupRef.current = mainSpatialGroup;
        mainSpatialGroup.visible = false;

        // A. 3D Business Card Base (1.0 x 0.6 x 0.02)
        const createCardBaseMesh = () => {
          const cardGeo = new THREE.BoxGeometry(1.0, 0.6, 0.02);

          const canvas = document.createElement("canvas");
          canvas.width = 1024;
          canvas.height = 614;
          const ctx = canvas.getContext("2d");

          ctx.fillStyle = "#0B0E14";
          ctx.fillRect(0, 0, 1024, 614);

          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 14;
          ctx.strokeRect(20, 20, 984, 574);

          ctx.strokeStyle = "#AA771C";
          ctx.lineWidth = 4;
          ctx.strokeRect(32, 32, 960, 550);

          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 56px \"Playfair Display\", serif";
          ctx.fillText("MM INTERIORS VIZAG", 280, 160);

          ctx.fillStyle = "#F3E5AB";
          ctx.font = "bold 26px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("Luxury Architectural Interiors & Turnkey Design", 280, 220);

          ctx.fillStyle = "#D4AF37";
          ctx.font = "600 24px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("• Siripuram, Vizag   • +91 98765 43210   • www.mminteriorsvizag.com", 60, 540);

          const cardTexture = new THREE.CanvasTexture(canvas);

          const sideMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.9, roughness: 0.2 });
          const frontMat = new THREE.MeshStandardMaterial({ map: cardTexture, roughness: 0.2, metalness: 0.3 });
          const backMat = new THREE.MeshStandardMaterial({ color: 0x0B0E14, metalness: 0.8, roughness: 0.3 });

          return new THREE.Mesh(cardGeo, [sideMat, sideMat, sideMat, sideMat, frontMat, backMat]);
        };

        mainSpatialGroup.add(createCardBaseMesh());

        // B. Compact 3D Extruded Logo Monogram
        const createMMLogoGroup = () => {
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
            steps: 1,
            depth: 0.2,
            bevelEnabled: true,
            bevelThickness: 0.04,
            bevelSize: 0.03,
            bevelSegments: 3
          });
          geometry.center();

          const goldMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.95, roughness: 0.15 });
          const mesh = new THREE.Mesh(geometry, goldMat);
          mesh.name = "MMLogoMesh";
          mmGroup.add(mesh);

          mmGroup.position.set(-0.35, 0, 0.06);
          mmGroup.scale.set(0.22, 0.22, 0.22);
          mmLogoGroupRef.current = mmGroup;
          return mmGroup;
        };

        mainSpatialGroup.add(createMMLogoGroup());

        // C. Compact 3D Header Banner
        const createHeaderBannerMesh = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 1024;
          canvas.height = 280;
          const ctx = canvas.getContext("2d");

          ctx.fillStyle = "#0B0E14";
          ctx.fillRect(0, 0, 1024, 280);

          ctx.strokeStyle = "#D4AF37";
          ctx.lineWidth = 8;
          ctx.strokeRect(10, 10, 1004, 260);

          ctx.fillStyle = "#D4AF37";
          ctx.font = "bold 46px \"Playfair Display\", serif";
          ctx.fillText("MM INTERIORS VIZAG", 40, 80);

          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 28px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("LUXURY SPATIAL PORTFOLIO", 40, 140);

          ctx.fillStyle = "#A0A5B5";
          ctx.font = "22px \"Plus Jakarta Sans\", sans-serif";
          ctx.fillText("Siripuram, Visakhapatnam  |  +91 98765 43210", 40, 210);

          const bannerTexture = new THREE.CanvasTexture(canvas);
          const bannerGeo = new THREE.PlaneGeometry(1.2, 0.33);
          const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTexture });

          const mesh = new THREE.Mesh(bannerGeo, bannerMat);
          mesh.position.set(0, 0.52, 0.03);

          const frameGeo = new THREE.BoxGeometry(1.22, 0.35, 0.01);
          const frameMat = new THREE.MeshStandardMaterial({ color: 0x141822, metalness: 0.8, roughness: 0.2 });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(0, 0.52, 0.02);

          const group = new THREE.Group();
          group.add(frameMesh);
          group.add(mesh);
          return group;
        };

        mainSpatialGroup.add(createHeaderBannerMesh());

        // D. Compact 3D Video Screen
        const createVideoScreenMesh = () => {
          const videoGeo = new THREE.PlaneGeometry(1.1, 0.62);
          const videoMat = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
          const videoMesh = new THREE.Mesh(videoGeo, videoMat);
          videoMesh.position.set(0, 1.05, 0.03);
          videoMesh.name = "VideoScreenMesh";
          videoMeshRef.current = videoMesh;

          const frameGeo = new THREE.BoxGeometry(1.14, 0.66, 0.015);
          const frameMat = new THREE.MeshStandardMaterial({ color: 0x141822, metalness: 0.9, roughness: 0.2 });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(0, 1.05, 0.02);

          const group = new THREE.Group();
          group.add(frameMesh);
          group.add(videoMesh);
          return group;
        };

        mainSpatialGroup.add(createVideoScreenMesh());

        // E. Compact 3D Portfolio Fan Cards (Fit cleanly inside screen view)
        const createPortfolioFanGroup = () => {
          const fanGroup = new THREE.Group();
          fanGroupRef.current = fanGroup;
          projectMeshesRef.current = [];

          portfolioProjects.forEach((proj, idx) => {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 680;
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#0B0E14";
            ctx.fillRect(0, 0, 512, 680);

            ctx.strokeStyle = proj.color;
            ctx.lineWidth = 10;
            ctx.strokeRect(12, 12, 488, 656);

            ctx.fillStyle = "#141822";
            ctx.fillRect(16, 16, 480, 110);

            ctx.fillStyle = proj.color;
            ctx.font = "bold 26px \"Playfair Display\", serif";
            ctx.fillText(proj.category.toUpperCase(), 35, 60);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = "bold 32px \"Playfair Display\", serif";
            ctx.fillText(proj.title, 35, 100);

            ctx.fillStyle = proj.color;
            ctx.font = "bold 22px \"Plus Jakarta Sans\", sans-serif";
            ctx.fillText("📍 " + proj.location, 35, 160);

            ctx.fillStyle = "#D1D5DB";
            ctx.font = "22px \"Plus Jakarta Sans\", sans-serif";
            const words = proj.desc.split(" ");
            let line = "";
            let y = 220;
            words.forEach((word) => {
              const testLine = line + word + " ";
              if (ctx.measureText(testLine).width > 440) {
                ctx.fillText(line, 35, y);
                line = word + " ";
                y += 34;
              } else {
                line = testLine;
              }
            });
            ctx.fillText(line, 35, y);

            ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
            ctx.fillRect(35, 430, 442, 110);
            ctx.strokeStyle = proj.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(35, 430, 442, 110);

            ctx.fillStyle = "#F3E5AB";
            ctx.font = "bold 20px \"Plus Jakarta Sans\", sans-serif";
            proj.specs.forEach((spec, sIdx) => {
              ctx.fillText("• " + spec, 55, 465 + sIdx * 30);
            });

            ctx.fillStyle = proj.color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(35, 570, 442, 65, 16);
            else ctx.rect(35, 570, 442, 65);
            ctx.fill();

            ctx.fillStyle = "#07090D";
            ctx.font = "bold 24px \"Plus Jakarta Sans\", sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("TAP FOR 3D VIEW", 256, 612);
            ctx.textAlign = "left";

            const texture = new THREE.CanvasTexture(canvas);
            const panelGeo = new THREE.PlaneGeometry(0.52, 0.70);
            const panelMat = new THREE.MeshBasicMaterial({ map: texture });

            const mesh = new THREE.Mesh(panelGeo, panelMat);
            mesh.name = `ProjectMesh_${proj.id}`;
            mesh.userData = { project: proj, index: idx };

            // COMPACT SPATIAL POSITIONS (Total Width = ~2.0 units)
            const positions = [
              { x: -0.85, y: -0.52, z: 0.05, rotY: Math.PI / 24 },
              { x: -0.28, y: -0.52, z: 0.05, rotY: 0 },
              { x: 0.28, y: -0.52, z: 0.05, rotY: 0 },
              { x: 0.85, y: -0.52, z: 0.05, rotY: -Math.PI / 24 }
            ];

            const pos = positions[idx];
            mesh.position.set(pos.x, pos.y, pos.z);
            mesh.rotation.y = pos.rotY;

            const frameGeo = new THREE.BoxGeometry(0.54, 0.72, 0.01);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0x141822, metalness: 0.8, roughness: 0.2 });
            const frameMesh = new THREE.Mesh(frameGeo, frameMat);
            frameMesh.position.set(pos.x, pos.y, pos.z - 0.008);
            frameMesh.rotation.y = pos.rotY;

            const projGroup = new THREE.Group();
            projGroup.add(frameMesh);
            projGroup.add(mesh);

            fanGroup.add(projGroup);
            projectMeshesRef.current.push(mesh);
          });

          return fanGroup;
        };

        mainSpatialGroup.add(createPortfolioFanGroup());

        // F. Compact 3D Detail View Panel
        const createDetailViewPanelGroup = () => {
          const detailGroup = new THREE.Group();
          detailGroup.position.set(0, 0, 0.15);
          detailGroup.visible = false;
          detailPanelRef.current = detailGroup;

          const canvas = document.createElement("canvas");
          canvas.width = 1024;
          canvas.height = 768;
          const ctx = canvas.getContext("2d");
          portfolioCanvasRef.current = canvas;
          portfolioCtxRef.current = ctx;

          const texture = new THREE.CanvasTexture(canvas);
          portfolioTextureRef.current = texture;

          const detailGeo = new THREE.PlaneGeometry(1.5, 1.15);
          const detailMat = new THREE.MeshBasicMaterial({ map: texture });
          const detailMesh = new THREE.Mesh(detailGeo, detailMat);
          detailMesh.name = "ProjectDetailMesh";
          detailMeshRef.current = detailMesh;

          const frameGeo = new THREE.BoxGeometry(1.54, 1.19, 0.015);
          const frameMat = new THREE.MeshStandardMaterial({ color: 0x141822, metalness: 0.9, roughness: 0.15 });
          const frameMesh = new THREE.Mesh(frameGeo, frameMat);
          frameMesh.position.set(0, 0, -0.01);

          // 3D Back Button
          const backCanvas = document.createElement("canvas");
          backCanvas.width = 320;
          backCanvas.height = 100;
          const bCtx = backCanvas.getContext("2d");
          bCtx.fillStyle = "#D4AF37";
          bCtx.fillRect(0, 0, 320, 100);
          bCtx.fillStyle = "#07090D";
          bCtx.font = "bold 32px \"Plus Jakarta Sans\", sans-serif";
          bCtx.textAlign = "center";
          bCtx.fillText("⬅ BACK TO FAN", 160, 62);

          const backTex = new THREE.CanvasTexture(backCanvas);
          const backGeo = new THREE.PlaneGeometry(0.5, 0.16);
          const backMat = new THREE.MeshBasicMaterial({ map: backTex });
          const backMesh = new THREE.Mesh(backGeo, backMat);
          backMesh.position.set(-0.45, 0.45, 0.02);
          backMesh.name = "BackButtonMesh";
          backBtnMeshRef.current = backMesh;

          detailGroup.add(frameMesh);
          detailGroup.add(detailMesh);
          detailGroup.add(backMesh);

          return detailGroup;
        };

        mainSpatialGroup.add(createDetailViewPanelGroup());

        // G. Compact 3D Action Buttons
        const createSocialButtonsGroup = () => {
          const socialGroup = new THREE.Group();
          socialMeshesRef.current = [];

          const socialItems = [
            { label: "📞 CALL", url: "tel:+919876543210", x: -0.6 },
            { label: "✉ EMAIL", url: "mailto:contact@mminteriorsvizag.com", x: -0.2 },
            { label: "🌐 WEB", url: "https://www.mminteriorsvizag.com", x: 0.2 },
            { label: "📍 MAP", action: "location", x: 0.6 }
          ];

          socialItems.forEach((item) => {
            const canvas = document.createElement("canvas");
            canvas.width = 240;
            canvas.height = 80;
            const ctx = canvas.getContext("2d");

            ctx.fillStyle = "#141822";
            ctx.fillRect(0, 0, 240, 80);
            ctx.strokeStyle = "#D4AF37";
            ctx.lineWidth = 4;
            ctx.strokeRect(6, 6, 228, 68);

            ctx.fillStyle = "#D4AF37";
            ctx.font = "bold 26px \"Plus Jakarta Sans\", sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(item.label, 120, 50);

            const texture = new THREE.CanvasTexture(canvas);
            const geo = new THREE.PlaneGeometry(0.32, 0.11);
            const mat = new THREE.MeshBasicMaterial({ map: texture });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(item.x, -0.98, 0.03);
            mesh.name = `SocialMesh_${item.label}`;
            mesh.userData = item;

            socialGroup.add(mesh);
            socialMeshesRef.current.push(mesh);
          });

          return socialGroup;
        };

        mainSpatialGroup.add(createSocialButtonsGroup());

        // Attach mainSpatialGroup to Target Anchor
        anchor.group.add(mainSpatialGroup);

        // RAYCASTER HANDLER
        const handlePointerDown = (event) => {
          if (!mouseRef.current || !raycasterRef.current || !cameraRef.current) return;
          mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
          mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;

          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

          const clickableObjects = [
            ...projectMeshesRef.current,
            videoMeshRef.current,
            mmLogoGroupRef.current,
            backBtnMeshRef.current,
            ...socialMeshesRef.current
          ].filter(Boolean);

          const intersects = raycasterRef.current.intersectObjects(clickableObjects, true);

          if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            console.log("👆 [Raycaster] User tapped 3D Mesh:", hitMesh.name);

            if (hitMesh.userData && hitMesh.userData.project) {
              open3DProjectDetail(hitMesh.userData.project);
            } else if (hitMesh === backBtnMeshRef.current || hitMesh.name === "BackButtonMesh") {
              close3DProjectDetail();
            } else if (hitMesh === videoMeshRef.current || hitMesh.name === "VideoScreenMesh") {
              const v = videoElementRef.current;
              if (v) {
                if (v.paused) {
                  v.play();
                  triggerToast("⏯️ 3D Interior Video Playing");
                } else {
                  v.pause();
                  triggerToast("⏯️ 3D Interior Video Paused");
                }
              }
            } else if (hitMesh.name === "MMLogoMesh") {
              triggerLogoAnimation();
            } else if (hitMesh.userData && hitMesh.userData.url) {
              window.open(hitMesh.userData.url, "_blank");
            } else if (hitMesh.userData && hitMesh.userData.action === "location") {
              triggerToast("📍 Studio: Siripuram, Visakhapatnam");
            }
          }
        };

        window.addEventListener("pointerdown", handlePointerDown);

        // START MINDAR CAMERA ENGINE
        console.log("🎥 [MindAR] Starting Camera Feed & Target Tracking Engine...");
        await mindarThree.start();
        console.log("✅ [MindAR] Camera stream active! Ready to scan target.");
        setArStarted(true);

        renderer.setAnimationLoop(() => {
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

  const animateEntrance = () => {
    if (!fanGroupRef.current || !mmLogoGroupRef.current) return;

    gsap.fromTo(
      fanGroupRef.current.scale,
      { x: 0.1, y: 0.1, z: 0.1 },
      { x: 1.0, y: 1.0, z: 1.0, duration: 1.0, ease: "back.out(1.5)" }
    );
  };

  const renderDetailCanvas = (proj) => {
    const canvas = portfolioCanvasRef.current;
    const ctx = portfolioCtxRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#0B0E14";
    ctx.fillRect(0, 0, 1024, 768);

    ctx.strokeStyle = proj.color;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, 984, 728);

    ctx.fillStyle = "#141822";
    ctx.fillRect(30, 30, 964, 120);

    ctx.fillStyle = proj.color;
    ctx.font = "bold 36px \"Playfair Display\", serif";
    ctx.fillText(proj.category.toUpperCase() + " • SPATIAL DETAIL VIEW", 60, 80);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 46px \"Playfair Display\", serif";
    ctx.fillText(proj.title, 60, 130);

    ctx.fillStyle = proj.color;
    ctx.font = "600 28px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("📍 " + proj.location, 60, 200);

    ctx.fillStyle = "#E5E7EB";
    ctx.font = "26px \"Plus Jakarta Sans\", sans-serif";
    const words = proj.desc.split(" ");
    let line = "";
    let y = 260;
    words.forEach((w) => {
      const test = line + w + " ";
      if (ctx.measureText(test).width > 900) {
        ctx.fillText(line, 60, y);
        line = w + " ";
        y += 40;
      } else {
        line = test;
      }
    });
    ctx.fillText(line, 60, y);

    ctx.fillStyle = "rgba(212, 175, 55, 0.15)";
    ctx.fillRect(60, 440, 904, 180);
    ctx.strokeStyle = proj.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(60, 440, 904, 180);

    ctx.fillStyle = "#F3E5AB";
    ctx.font = "bold 26px \"Plus Jakarta Sans\", sans-serif";
    ctx.fillText("✨ ARCHITECTURAL SPECIFICATIONS & TURNKEY HIGHLIGHTS:", 90, 490);

    proj.specs.forEach((spec, idx) => {
      ctx.fillText("• " + spec, 90, 540 + idx * 35);
    });

    if (portfolioTextureRef.current) portfolioTextureRef.current.needsUpdate = true;
  };

  const open3DProjectDetail = (proj) => {
    renderDetailCanvas(proj);

    if (fanGroupRef.current) {
      gsap.to(fanGroupRef.current.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.4 });
    }

    if (detailPanelRef.current) {
      detailPanelRef.current.visible = true;
      gsap.fromTo(
        detailPanelRef.current.scale,
        { x: 0.1, y: 0.1, z: 0.1 },
        { x: 1.0, y: 1.0, z: 1.0, duration: 0.5, ease: "back.out(1.5)" }
      );
    }
  };

  const close3DProjectDetail = () => {
    if (detailPanelRef.current) {
      gsap.to(detailPanelRef.current.scale, {
        x: 0.001,
        y: 0.001,
        z: 0.001,
        duration: 0.3,
        onComplete: () => {
          if (detailPanelRef.current) detailPanelRef.current.visible = false;
        }
      });
    }

    if (fanGroupRef.current) {
      gsap.to(fanGroupRef.current.scale, { x: 1.0, y: 1.0, z: 1.0, duration: 0.5, ease: "power2.out" });
    }
  };

  const triggerLogoAnimation = () => {
    if (!mmLogoGroupRef.current) return;
    triggerToast("✨ 3D MM Logo Monogram Animation");
    const group = mmLogoGroupRef.current;
    gsap.timeline()
      .to(group.position, { z: 0.4, duration: 0.8, ease: "back.out(1.7)" })
      .to(group.rotation, { y: Math.PI * 2, duration: 1.0, ease: "power2.inOut" }, "<")
      .to(group.position, { z: 0.06, duration: 0.6, ease: "power2.in" });
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none">
      {/* MindAR Camera Feed Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0"></div>

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

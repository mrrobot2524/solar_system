class SolarSystemExplorer {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.setupCanvas();

    // Camera and interaction
    this.camera = { x: 0, y: 0, zoom: 1, rotation: 0 };
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
    this.focusTarget = null;
    this.focusTransition = 0;

    // Time and physics
    this.time = 0;
    this.timeSpeed = 1;
    this.showOrbits = true;

    // Celestial bodies with realistic data
    this.bodies = {
      sun: {
        name: "Sun",
        x: 0,
        y: 0,
        radius: 30,
        color: "#FDB813",
        mass: 1.989e30,
        info: {
          diameter: "1.39 million km",
          mass: "333,000 Earth masses",
          temperature: "5,778 K surface",
          facts:
            "The Sun contains 99.86% of the Solar System's mass and generates energy through nuclear fusion.",
        },
      },
      earth: {
        name: "Earth",
        x: 0,
        y: 0,
        radius: 8,
        color: "#6B93D6",
        orbitRadius: 200,
        orbitSpeed: 0.02,
        angle: 0,
        mass: 5.972e24,
        info: {
          diameter: "12,742 km",
          distance: "149.6 million km from Sun",
          day: "24 hours",
          year: "365.25 days",
          facts:
            "Earth is the only known planet with life. It has a protective magnetic field and atmosphere.",
        },
      },
      moon: {
        name: "Moon",
        x: 0,
        y: 0,
        radius: 3,
        color: "#C0C0C0",
        orbitRadius: 25,
        orbitSpeed: 0.25,
        angle: 0,
        parent: "earth",
        mass: 7.342e22,
        info: {
          diameter: "3,474 km",
          distance: "384,400 km from Earth",
          day: "27.3 Earth days",
          facts:
            "The Moon causes Earth's tides and stabilizes our planet's axial tilt, making seasons more stable.",
        },
      },
      mars: {
        name: "Mars",
        x: 0,
        y: 0,
        radius: 6,
        color: "#CD5C5C",
        orbitRadius: 300,
        orbitSpeed: 0.011,
        angle: Math.PI,
        mass: 6.39e23,
        info: {
          diameter: "6,779 km",
          distance: "227.9 million km from Sun",
          day: "24.6 hours",
          year: "687 Earth days",
          facts:
            "Mars has the largest volcano in the Solar System (Olympus Mons) and evidence of ancient water flows.",
        },
      },
    };

    this.setupEventListeners();
    this.setupControls();
    this.gameLoop();
  }

  setupCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    });
  }

  setupEventListeners() {
    // Mouse controls
    this.canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.lastMouse = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMouse.x;
        const dy = e.clientY - this.lastMouse.y;

        this.camera.x += dx / this.camera.zoom;
        this.camera.y += dy / this.camera.zoom;

        this.lastMouse = { x: e.clientX, y: e.clientY };
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.camera.zoom = Math.max(
        0.1,
        Math.min(5, this.camera.zoom * zoomFactor),
      );
      document.getElementById("zoomLevel").value = this.camera.zoom;
      document.getElementById("zoomDisplay").textContent =
        this.camera.zoom.toFixed(1) + "x";
    });

    // Click to select planets
    this.canvas.addEventListener("click", (e) => {
      if (!this.isDragging) {
        this.handlePlanetClick(e);
      }
    });
  }

  setupControls() {
    document.getElementById("timeSpeed").addEventListener("input", (e) => {
      this.timeSpeed = parseFloat(e.target.value);
      document.getElementById("speedDisplay").textContent =
        this.timeSpeed.toFixed(1) + "x";
    });

    document.getElementById("zoomLevel").addEventListener("input", (e) => {
      this.camera.zoom = parseFloat(e.target.value);
      document.getElementById("zoomDisplay").textContent =
        this.camera.zoom.toFixed(1) + "x";
    });
  }

  handlePlanetClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates
    const worldX =
      (mouseX - this.canvas.width / 2) / this.camera.zoom - this.camera.x;
    const worldY =
      (mouseY - this.canvas.height / 2) / this.camera.zoom - this.camera.y;

    // Check if click is on any planet
    for (const [key, body] of Object.entries(this.bodies)) {
      const dx = worldX - body.x;
      const dy = worldY - body.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= body.radius + 5) {
        this.selectBody(key);
        break;
      }
    }
  }

  selectBody(bodyKey) {
    const body = this.bodies[bodyKey];
    const info = body.info;

    document.getElementById("selectedInfo").innerHTML = `
        <h4 style="color: #64c8ff;">${body.name}</h4>
        <div class="stats">
            <p><strong>Diameter:</strong> ${info.diameter}</p>
            ${info.distance ? `<p><strong>Distance:</strong> ${info.distance}</p>` : ""}
            ${info.day ? `<p><strong>Day Length:</strong> ${info.day}</p>` : ""}
            ${info.year ? `<p><strong>Year Length:</strong> ${info.year}</p>` : ""}
            ${info.temperature ? `<p><strong>Temperature:</strong> ${info.temperature}</p>` : ""}
            <p style="margin-top: 10px;"><strong>Did you know?</strong><br>${info.facts}</p>
        </div>
    `;
  }

  updatePhysics() {
    this.time += this.timeSpeed * 0.016; // 60 FPS base

    // Update planetary positions
    for (const [key, body] of Object.entries(this.bodies)) {
      if (body.orbitRadius) {
        body.angle += body.orbitSpeed * this.timeSpeed * 0.016;

        if (body.parent) {
          // Moon orbits Earth
          const parent = this.bodies[body.parent];
          body.x = parent.x + Math.cos(body.angle) * body.orbitRadius;
          body.y = parent.y + Math.sin(body.angle) * body.orbitRadius;
        } else {
          // Planets orbit Sun
          body.x = Math.cos(body.angle) * body.orbitRadius;
          body.y = Math.sin(body.angle) * body.orbitRadius;
        }
      }
    }

    // Update time display
    const earthDays = Math.floor(this.time * 10);
    const earthYears = Math.floor(earthDays / 365) + 2024;
    const marsYears = Math.floor(earthDays / 687) + 2024;

    document.getElementById("dayCounter").textContent = earthDays;
    document.getElementById("yearCounter").textContent = earthYears;
    document.getElementById("marsYearCounter").textContent = marsYears;
  }

  render() {
    // Clear canvas with space background
    this.ctx.fillStyle = "#0a0a1a";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Add stars
    this.drawStars();

    // Set up camera transform
    this.ctx.save();
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(this.camera.x, this.camera.y);

    // Draw orbital paths
    if (this.showOrbits) {
      this.drawOrbits();
    }

    // Draw celestial bodies
    this.drawBodies();

    this.ctx.restore();
  }

  drawStars() {
    this.ctx.fillStyle = "white";
    for (let i = 0; i < 200; i++) {
      const x = (i * 37) % this.canvas.width;
      const y = (i * 73) % this.canvas.height;
      const size = Math.random() * 2;
      this.ctx.fillRect(x, y, size, size);
    }
  }

  drawOrbits() {
    this.ctx.strokeStyle = "rgba(100, 200, 255, 0.3)";
    this.ctx.lineWidth = 1;

    for (const body of Object.values(this.bodies)) {
      if (body.orbitRadius && !body.parent) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, body.orbitRadius, 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (body.parent) {
        const parent = this.bodies[body.parent];
        this.ctx.beginPath();
        this.ctx.arc(parent.x, parent.y, body.orbitRadius, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    }
  }

  drawBodies() {
    for (const [key, body] of Object.entries(this.bodies)) {
      // Draw planet
      this.ctx.fillStyle = body.color;
      this.ctx.beginPath();
      this.ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Add glow effect for sun
      if (key === "sun") {
        const gradient = this.ctx.createRadialGradient(
          body.x,
          body.y,
          body.radius,
          body.x,
          body.y,
          body.radius * 2,
        );
        gradient.addColorStop(0, "rgba(253, 184, 19, 0.3)");
        gradient.addColorStop(1, "rgba(253, 184, 19, 0)");
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(body.x, body.y, body.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Draw label
      this.ctx.fillStyle = "white";
      this.ctx.font = "12px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(body.name, body.x, body.y + body.radius + 15);
    }
  }

  gameLoop() {
    this.updatePhysics();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

// Global functions for UI
function focusOnBody(bodyKey) {
  const body = game.bodies[bodyKey];
  game.camera.x = -body.x;
  game.camera.y = -body.y;
  game.selectBody(bodyKey);
}

function toggleOrbits() {
  game.showOrbits = !game.showOrbits;
  document.getElementById("orbitToggle").textContent = game.showOrbits
    ? "Hide Orbits"
    : "Show Orbits";
}

function resetView() {
  game.camera.x = 0;
  game.camera.y = 0;
  game.camera.zoom = 1;
  document.getElementById("zoomLevel").value = 1;
  document.getElementById("zoomDisplay").textContent = "1x";
}

// Initialize the game
const game = new SolarSystemExplorer();

(function () {
  function c() {
    let b = a.contentDocument || a.contentWindow.document;
    if (b) {
      let d = b.createElement("script");
      d.innerHTML =
        "window.__CF$cv$params={r:'97e7ff88508cc61b',t:'MTc1Nzc3MDIxNS4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
      b.getElementsByTagName("head")[0].appendChild(d);
    }
  }
  if (document.body) {
    let a = document.createElement("iframe");
    a.height = 1;
    a.width = 1;
    a.style.position = "absolute";
    a.style.top = 0;
    a.style.left = 0;
    a.style.border = "none";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    if ("loading" !== document.readyState) c();
    else if (window.addEventListener)
      document.addEventListener("DOMContentLoaded", c);
    else {
      let e = document.onreadystatechange || function () {};
      document.onreadystatechange = function (b) {
        e(b);
        "loading" !== document.readyState &&
          ((document.onreadystatechange = e), c());
      };
    }
  }
})();

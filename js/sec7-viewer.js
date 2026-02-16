// =====================================================
// SECÇÃO 7: AÇÕES - VIEWER & LOGIC (v11.1 Supabase)
// =====================================================
// Adaptado de Index_v11.0.html Firebase → Supabase
// Data: 2026-02-16
// =====================================================

// ===== ESTADO GLOBAL =====
let currentBlockId = null;
let currentZonamentoFloor = null;
let floorViewer = null;

// ===== HELPER: GET PROJECT ID =====
function getCurrentProjectId() {
  if (window.appState && window.appState.activeProjectId) {
    return window.appState.activeProjectId;
  }
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('project') || null;
}

// ===== INIT SELECTOR BLOCO (v11.1) =====
async function initSec7BlocoSelector() {
  const projectId = getCurrentProjectId();
  if (!projectId) {
    console.warn('[Sec7] Project ID não disponível');
    return;
  }

  try {
    const { data: blocks, error } = await window.supabaseClient
      .from('blocks')
      .select('id, name')
      .eq('project_id', projectId)
      .order('created_at');

    if (error) throw error;

    const select = document.getElementById('sec7-bloco-principal');
    if (!select) return;

    select.innerHTML = '<option value="">-- Escolher bloco --</option>';
    (blocks || []).forEach(block => {
      const option = document.createElement('option');
      option.value = block.id;
      option.textContent = block.name;
      select.appendChild(option);
    });

    // Listener: Bloco change
    select.addEventListener('change', async (e) => {
      currentBlockId = e.target.value;
      const conteudo = document.getElementById('sec7-conteudo-v11');

      if (!currentBlockId) {
        conteudo.style.display = 'none';
        return;
      }

      // Mostrar conteúdo + popular selector pisos
      conteudo.style.display = 'block';
      await populateZonamentoFloorSelector();
    });

  } catch (error) {
    console.error('[Sec7] Erro init selector bloco:', error);
  }
}

// ===== POPULATE FLOOR SELECTOR =====
async function populateZonamentoFloorSelector() {
  const select = document.getElementById('zonamentoFloorSelect');
  if (!select || !currentBlockId) return;

  try {
    const { data: floors, error } = await window.supabaseClient
      .from('floors')
      .select('id, name, cota, actions_data')
      .eq('block_id', currentBlockId)
      .order('cota');

    if (error) throw error;

    select.innerHTML = '<option value="">-- Selecione um piso --</option>';
    (floors || []).forEach(floor => {
      const zoneCount = floor.actions_data?.layers ? Object.keys(floor.actions_data.layers).length : 0;
      const option = document.createElement('option');
      option.value = floor.id;
      option.textContent = `${floor.name} (Cota: ${floor.cota}m, ${zoneCount} zonas)`;
      select.appendChild(option);
    });

  } catch (error) {
    console.error('[Sec7] Erro popular pisos:', error);
  }
}

// ===== FLOOR SELECTOR CHANGE =====
async function onZonamentoFloorChange() {
  const select = document.getElementById('zonamentoFloorSelect');
  const floorId = select.value;

  if (!floorId) {
    currentZonamentoFloor = null;
    if (floorViewer) floorViewer.clear();
    return;
  }

  try {
    const { data: floor, error } = await window.supabaseClient
      .from('floors')
      .select('id, name, cota, actions_data, image_path')
      .eq('id', floorId)
      .single();

    if (error) throw error;

    if (floor) {
      currentZonamentoFloor = floor;
      if (floorViewer && floor.actions_data) {
        floorViewer.loadData(floor.actions_data);
        floorViewer.render();
      } else if (floorViewer) {
        floorViewer.clear();
      }
    }
  } catch (error) {
    console.error('[Sec7] Erro carregar floor:', error);
  }
}

// ===== OPEN ZONAMENTO EDITOR =====
function openZonamentoEditor() {
  const select = document.getElementById('zonamentoFloorSelect');
  const floorId = select.value;

  if (!floorId) {
    alert('Por favor, selecione um piso primeiro.');
    return;
  }

  if (!currentZonamentoFloor) {
    alert('⚠️ Piso não encontrado!');
    return;
  }

  // Fallback: sessionStorage (compatibilidade)
  if (currentZonamentoFloor.actions_data) {
    sessionStorage.setItem(`zonas_input_${floorId}`, JSON.stringify(currentZonamentoFloor.actions_data));
  } else {
    sessionStorage.removeItem(`zonas_input_${floorId}`);
  }

  // Open popup
  const popup = window.open(`zonas.html?piso=${floorId}`, '_blank', 'width=1400,height=900');

  // Listen for 'editorReady' from zonas.html
  const messageHandler = (event) => {
    if (event.data.type === 'editorReady' && event.data.floorId === floorId) {
      console.log('[Index] Received editorReady, sending actionsData...');
      popup.postMessage({
        type: 'initEditor',
        floorId: floorId,
        data: currentZonamentoFloor.actions_data || { layers: {} }
      }, '*');

      console.log('[Index] Sent initEditor postMessage:', {
        floorId: floorId,
        hasActionsData: !!currentZonamentoFloor.actions_data,
        layersCount: Object.keys(currentZonamentoFloor.actions_data?.layers || {}).length
      });

      // Remove listener after sending
      window.removeEventListener('message', messageHandler);
    }
  };
  window.addEventListener('message', messageHandler);

  // Timeout fallback
  setTimeout(() => {
    if (popup && !popup.closed) {
      console.log('[Index] Timeout fallback: sending actionsData...');
      popup.postMessage({
        type: 'initEditor',
        floorId: floorId,
        data: currentZonamentoFloor.actions_data || { layers: {} }
      }, '*');
    }
  }, 500);
}

// ===== SET VIEWER MODE =====
function setViewerMode(mode) {
  // Update button states
  document.querySelectorAll('.viewer-toolbar button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-${mode}`)?.classList.add('active');

  if (floorViewer) {
    floorViewer.setMode(mode);
    floorViewer.render();
  }
}

// ===== POSTMESSAGE LISTENER (SAVE FROM zonas.html) =====
window.addEventListener('message', async (event) => {
  console.log("[Sec7] window.message received:", event.data);
  
  if (event.data.type === 'zonesData') {
    const { floorId, data } = event.data;
    
    try {
      // Save to Supabase
      const { error } = await window.supabaseClient
        .from('floors')
        .update({ actions_data: data })
        .eq('id', floorId);

      if (error) throw error;

      console.log('[Sec7] ✅ Zonamento guardado no Supabase');

      // Update local state
      if (currentZonamentoFloor && currentZonamentoFloor.id === floorId) {
        currentZonamentoFloor.actions_data = data;
        if (floorViewer) {
          floorViewer.loadData(data);
          floorViewer.render();
        }
      }

      // Refresh floor selector
      await populateZonamentoFloorSelector();

    } catch (error) {
      console.error('[Sec7] Erro guardar zonamento:', error);
      alert('❌ Erro ao guardar zonamento. Verifique console.');
    }
  }
});

// ===== TOGGLE ACTION SECTION =====
function toggleActionSection(name, enabled) {
  const section = document.getElementById(`section-${name}`);
  if (!section) {
    console.warn(`toggleActionSection: elemento 'section-${name}' não encontrado`);
    return;
  }
  
  if (enabled) {
    section.classList.add('active');
    // Se for sismo, gerar gráficos
    if (name === 'sismo') {
      setTimeout(generateSeismicCharts, 100);
    }
  } else {
    section.classList.remove('active');
  }
}

// ===== TOGGLE ACTION BODY =====
function toggleActionBody(name) {
  const body = document.getElementById(`body-${name}`);
  const toggle = document.querySelector(`#section-${name} .action-toggle`);
  if (body) body.classList.toggle('show');
  if (toggle) toggle.classList.toggle('open');
}

// ===== INIT FLOOR VIEWER =====
function initFloorViewer() {
  const canvas = document.getElementById('zonamentoCanvas');
  if (canvas && !floorViewer) {
    floorViewer = new FloorViewer(canvas);
  }
}

// =====================================================
// FLOOR VIEWER CLASS
// =====================================================
class FloorViewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = null;
    this.mode = 'limpa';
    this.blueprint = null;

    // Analysis state
    this.lastMouse = { x: 0, y: 0 };
    this.probePoint = null;
    this.predimStart = null;
    this.predimEnd = null;
    this.isDragging = false;
    this.pillarRects = [];

    // Transform state
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    // Bind handlers
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
  }

  async loadData(data) {
    this.data = data;
    this.blueprint = null;

    // Reset transform
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    if (data.blueprint && data.blueprint.image) {
      const img = new Image();
      img.onload = () => {
        this.blueprint = img;
        this.updateFitTransform();
        this.render();
      };
      img.src = data.blueprint.image;
    } else {
      this.render();
    }
  }

  updateFitTransform() {
    if (!this.blueprint) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = this.blueprint.width;
    const ih = this.blueprint.height;

    // Calculate scale to fit
    const scaleW = cw / iw;
    const scaleH = ch / ih;
    this.scale = Math.min(scaleW, scaleH);

    // Center
    this.offsetX = (cw - iw * this.scale) / 2;
    this.offsetY = (ch - ih * this.scale) / 2;
  }

  setMode(mode) {
    this.mode = mode;
    this.predimStart = null;
    this.predimEnd = null;
    this.probePoint = null;
    this.render();
  }

  clear() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#1a1f2a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Clear info panel
    const panel = document.getElementById('zonamentoInfoPanel');
    if (panel) {
      panel.innerHTML = `
        <div class="empty-state">
          <p>👆 Selecione um piso e um modo de visualização</p>
          <p style="font-size:11px;margin-top:8px;color:var(--muted)">
            No modo <strong>Combinações</strong>, clique numa zona para ver o breakdown de cargas
          </p>
        </div>
      `;
    }
  }

  render() {
    if (!this.data) {
      this.clear();
      return;
    }

    // Reset transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply transform
    this.ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);

    // Draw blueprint
    if (this.blueprint && this.blueprint.complete) {
      this.ctx.globalAlpha = 1.0;
      this.ctx.drawImage(this.blueprint, 0, 0);
    }

    // Render layers based on mode
    switch (this.mode) {
      case 'limpa':
        break;
      case 'lajes':
        this.renderLajes(1.0);
        break;
      case 'sobrecargas':
        this.renderSobrecargas(1.0);
        this.renderLoadTable('Sobrecarga');
        break;
      case 'rcp':
        this.renderRCP(1.0);
        this.renderLoadTable('RCP');
        break;
      case 'combinacoes':
        this.renderCombinacoes();
        break;
      case 'heatmap':
        this.renderHeatmap();
        break;
      case 'probe':
        this.renderProbe();
        break;
      case 'predim':
        this.renderPreDimensionamento();
        break;
      case 'predimpil':
        this.renderPreDimPilares();
        break;
    }
  }

  renderLajes(alpha = 0.5) {
    if (!this.data || !this.data.layers) return;
    const zones = this.data.layers['Estrutura'] || this.data.layers['Espessuras'] || [];
    zones.forEach(zone => {
      if (zone.shapes) {
        const h = parseFloat(zone.manualLoad) || 0.20;
        const grayVal = Math.max(100, 220 - (h - 0.15) * 400);
        const color = `rgb(${grayVal}, ${grayVal}, ${grayVal})`;
        zone.shapes.forEach(points => {
          this.drawPolygon(points, color, alpha);
          if (alpha > 0.5) this.drawPolygonLabel(points, `${(h * 100).toFixed(0)}cm`);
        });
      }
    });
  }

  renderSobrecargas(alpha = 0.5) {
    if (!this.data || !this.data.layers) return;
    for (let layerName in this.data.layers) {
      if (layerName === 'Sobrecargas' || layerName.includes('Sobrecarga')) {
        const zones = this.data.layers[layerName];
        zones.forEach(zone => {
          if (zone.shapes) {
            const qk = this.getCategoryLoad(zone.uso || 'B');
            const intensity = Math.min(100, (qk / 7.5) * 100);
            const color = `hsl(50, 100%, ${90 - (intensity * 0.4)}%)`;
            zone.shapes.forEach(points => {
              this.drawPolygon(points, color, alpha);
              if (alpha > 0.5) this.drawPolygonLabel(points, `${qk.toFixed(1)} kN/m²`);
            });
          }
        });
      }
    }
  }

  renderRCP(alpha = 0.5) {
    if (!this.data || !this.data.layers) return;
    for (let layerName in this.data.layers) {
      if (layerName.includes('Paredes') || layerName.includes('RP') || layerName.includes('RCP')) {
        const zones = this.data.layers[layerName];
        zones.forEach(zone => {
          if (zone.shapes) {
            const load = parseFloat(zone.manualLoad) || 1.0;
            const intensity = Math.min(100, (load / 5) * 100);
            const color = `hsl(145, 60%, ${80 - (intensity * 0.4)}%)`;
            zone.shapes.forEach(points => {
              this.drawPolygon(points, color, alpha);
              if (alpha > 0.5) this.drawPolygonLabel(points, `${load.toFixed(1)} kN/m²`);
            });
          }
        });
      }
    }
  }

  renderCombinacoes() {
    this.renderLajes(0.3);
    this.renderSobrecargas(0.3);
    this.renderRCP(0.3);
    this.renderTotalFloorELU();
  }

  renderTotalFloorELU() {
    const stats = this.calculateFloorLoads();
    const panel = document.getElementById('zonamentoInfoPanel');
    if (!panel) return;

    panel.innerHTML = `
      <h4>🔥 Resumo ELU do Piso</h4>
      <div class="combinations-table-wrapper">
        <table class="action-table">
          <thead>
            <tr>
              <th>Componente</th>
              <th>Total (kN)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Peso Próprio (G)</td><td>${stats.G_total.toFixed(0)}</td></tr>
            <tr><td>Rest. Perm. (G)</td><td>${stats.RCP_total.toFixed(0)}</td></tr>
            <tr><td>Sobrecargas (Q)</td><td>${stats.Q_total.toFixed(0)}</td></tr>
          </tbody>
          <tfoot>
            <tr style="background:var(--accent); color:#fff; font-weight:bold">
              <td>TOTAL ELU (1.35G + 1.5Q)</td>
              <td>${(1.35 * (stats.G_total + stats.RCP_total) + 1.5 * stats.Q_total).toFixed(0)} kN</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p style="font-size:11px; color:var(--muted); margin-top:10px">
        💡 Clique num ponto para ver o breakdown detalhado.
      </p>
    `;
  }

  calculateFloorLoads() {
    let G_total = 0, RCP_total = 0, Q_total = 0;
    if (!this.data || !this.data.layers) return { G_total, RCP_total, Q_total };

    for (let name in this.data.layers) {
      const zones = this.data.layers[name];
      zones.forEach(z => {
        let area = 0;
        if (z.shapes) z.shapes.forEach(s => area += this.polygonArea(s));
        
        if (name === 'Estrutura' || name.includes('Espessuras')) {
          G_total += (parseFloat(z.manualLoad) || 0.20) * 25 * area;
        } else if (name.includes('Sobrecarga')) {
          Q_total += this.getCategoryLoad(z.uso) * area;
        } else if (name.includes('Paredes') || name.includes('RP') || name.includes('RCP')) {
          RCP_total += (parseFloat(z.manualLoad) || 1.0) * area;
        }
      });
    }

    return { G_total, RCP_total, Q_total };
  }

  renderHeatmap() {
    // Simplified heatmap
    this.renderLajes(0.2);
    this.renderSobrecargas(0.2);
    this.renderRCP(0.2);
  }

  renderProbe() {
    this.renderLajes(0.3);
    this.renderSobrecargas(0.3);
    this.renderRCP(0.3);
    
    if (this.probePoint) {
      // Draw probe marker
      this.ctx.fillStyle = '#ff4757';
      this.ctx.beginPath();
      this.ctx.arc(this.probePoint.x, this.probePoint.y, 5 / this.scale, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  renderPreDimensionamento() {
    this.renderLajes(0.3);
  }

  renderPreDimPilares() {
    this.renderLajes(0.3);
  }

  renderLoadTable(type) {
    // Simplified load table
    const panel = document.getElementById('zonamentoInfoPanel');
    if (panel) {
      panel.innerHTML = `<p>📊 ${type} - Ver no modo Combinações</p>`;
    }
  }

  // ===== HELPERS =====
  drawPolygon(points, color, alpha = 1.0) {
    if (!points || points.length < 3) return;
    
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = color;
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 2 / this.scale;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawPolygonLabel(points, text) {
    if (!points || points.length < 3) return;
    
    const centroid = this.polygonCentroid(points);
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for text
    
    const screenX = centroid.x * this.scale + this.offsetX;
    const screenY = centroid.y * this.scale + this.offsetY;
    
    this.ctx.font = '12px sans-serif';
    this.ctx.fillStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, screenX, screenY);
    this.ctx.restore();
  }

  polygonCentroid(points) {
    let cx = 0, cy = 0;
    points.forEach(p => {
      cx += p.x;
      cy += p.y;
    });
    return { x: cx / points.length, y: cy / points.length };
  }

  polygonArea(points) {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area / 2);
  }

  getCategoryLoad(uso) {
    const map = {
      'A': 2.0, 'B': 3.0, 'C1': 3.0, 'C2': 4.0, 'C3': 5.0,
      'C4': 5.0, 'C5': 5.0, 'D1': 4.0, 'D2': 5.0,
      'E1': 7.5, 'E2': 7.5, 'F': 2.5, 'G': 5.0,
      'H': 0.4, 'I': 0.0
    };
    return map[uso] || 3.0;
  }

  // ===== EVENT HANDLERS =====
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - this.offsetX) / this.scale;
    const y = (e.clientY - rect.top - this.offsetY) / this.scale;

    if (this.mode === 'probe') {
      this.probePoint = { x, y };
      this.render();
    }
  }

  handleMouseDown(e) {
    if (this.mode === 'predim' || this.mode === 'predimpil') {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - this.offsetX) / this.scale;
      const y = (e.clientY - rect.top - this.offsetY) / this.scale;
      this.predimStart = { x, y };
      this.isDragging = true;
    }
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.lastMouse.x = e.clientX - rect.left;
    this.lastMouse.y = e.clientY - rect.top;

    if (this.isDragging && this.predimStart) {
      const x = (e.clientX - rect.left - this.offsetX) / this.scale;
      const y = (e.clientY - rect.top - this.offsetY) / this.scale;
      this.predimEnd = { x, y };
      this.render();
    }
  }

  handleMouseUp(e) {
    this.isDragging = false;
  }
}

// ===== SEISMIC CHARTS (PLACEHOLDER) =====
function generateSeismicCharts() {
  console.log('[Sec7] Generate seismic charts - TODO');
  // TODO: Implementar com Chart.js (requer dados EC8)
}

// ===== INIT ON LOAD =====
window.addEventListener('DOMContentLoaded', () => {
  console.log('[Sec7] Inicializando...');
  initSec7BlocoSelector();
  initFloorViewer();
});

// ===== EXPORTS =====
window.initSec7BlocoSelector = initSec7BlocoSelector;
window.populateZonamentoFloorSelector = populateZonamentoFloorSelector;
window.onZonamentoFloorChange = onZonamentoFloorChange;
window.openZonamentoEditor = openZonamentoEditor;
window.setViewerMode = setViewerMode;
window.toggleActionSection = toggleActionSection;
window.toggleActionBody = toggleActionBody;
window.generateSeismicCharts = generateSeismicCharts;

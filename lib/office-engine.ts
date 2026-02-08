type OfficeEngine = {
  handleEvent: (event: any) => void;
  destroy: () => void;
};

type InitOptions = {
  onTerminalLine?: (line: string) => void;
};

const OFFICE_TEMPLATE = `
  <div id="app">
    <div class="ambient">
      <div class="blob blob-violet"></div>
      <div class="blob blob-cyan"></div>
      <div class="blob blob-emerald"></div>
    </div>
    <header>
      <div class="header-left">
        <div class="header-brand">
          <div class="header-icon"></div>
          <div>
            <h1>Observatory</h1>
            <p class="sub">Real-time agent monitoring</p>
          </div>
        </div>
        <div class="live-badge">
          <span class="live-dot"></span>
          <span class="live-text">Live</span>
          <span class="live-count" id="stats">0 signals</span>
        </div>
        <div class="clock" id="clock"></div>
      </div>
      <div class="header-right">
        <div id="status" class="pill">connecting...</div>
        <button id="btnPause" class="btn-header" title="Pause/Resume">
          <span id="pauseIcon">||</span>
          <span id="playIcon" style="display:none">▶</span>
        </button>
        <button id="btnTest" class="btn-header" title="Send test event">Test</button>
      </div>
    </header>
    <div class="stats-row" id="statsRow">
      <div class="stat-card">
        <div class="stat-info"><p class="stat-label">Agents</p><p class="stat-value" id="statAgents">0</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-info"><p class="stat-label">Tasks Done</p><p class="stat-value" id="statTasks">0</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-info"><p class="stat-label">Messages</p><p class="stat-value" id="statMessages">0</p></div>
      </div>
      <div class="stat-card">
        <div class="stat-info"><p class="stat-label">Signals</p><p class="stat-value" id="statSignals">0</p></div>
      </div>
    </div>
    <main>
      <section class="office-pane">
        <div class="office-canvas-wrap">
          <canvas id="world"></canvas>
          <div id="particles"></div>
          <div id="agentLayer"></div>
          <div id="lineLayer"></div>
          <div id="missionBoard" class="mission-board" style="display:none"></div>
        </div>
        <div class="office-statusbar">
          <div class="statusbar-agents" id="statusbarAgents"></div>
          <div class="statusbar-mission">
            <span class="mission-dot"></span>
            <span id="missionText">All systems operational</span>
          </div>
        </div>
      </section>
      <aside class="feed-pane" id="feedPane">
        <div class="feed-header">
          <div class="feed-header-left">
            <div><h2>Activity Feed</h2><p class="sub" id="feedCount">0 events</p></div>
          </div>
          <button id="btnToggleFeed" class="btn-toggle-feed" title="Toggle feed"></button>
        </div>
        <div id="feed" class="feed-list"></div>
      </aside>
    </main>
    <div id="agentModal" class="modal-overlay" style="display:none">
      <div class="modal-card" id="modalCard"></div>
    </div>
  </div>
`;

export function initOffice(container: HTMLElement, options: InitOptions = {}): OfficeEngine {
  container.innerHTML = OFFICE_TEMPLATE;
  (window as any).__officeDisableStream = true;

  let ready = false;
  let queued: any[] = [];

  const boot = () => {
    ready = true;
    const handler = (window as any).__officeHandleEvent as ((evt: any) => void) | undefined;
    if (handler) {
      queued.forEach((evt) => handler(evt));
      queued = [];
    }
  };

  if ((window as any).__officeScriptLoaded) {
    boot();
  } else {
    const script = document.createElement('script');
    script.src = '/office-app.js';
    script.async = true;
    script.onload = () => {
      (window as any).__officeScriptLoaded = true;
      boot();
    };
    container.appendChild(script);
  }

  return {
    handleEvent: (event: any) => {
      if (event?.text && options.onTerminalLine) {
        options.onTerminalLine(event.text);
      }
      const handler = (window as any).__officeHandleEvent as ((evt: any) => void) | undefined;
      if (ready && handler) {
        handler(event);
      } else {
        queued.push(event);
      }
    },
    destroy: () => {
      container.innerHTML = '';
    },
  };
}

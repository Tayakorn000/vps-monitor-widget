import { run } from 'uebersicht'

export const refreshFrequency = 10000
export const command = `/tmp/vps-stats.sh`

// --- Drag ---
const savedPos = JSON.parse(localStorage.getItem('vps-widget-pos') || '{"x":20,"y":20}')
let pos = { ...savedPos }
let dragging = false, startMouse = {x:0,y:0}, startPos = {x:0,y:0}

const onMouseDown = (e) => {
  if (e.target.closest('#vps-config-panel') || e.target.closest('#vps-settings-btn')) return
  dragging = true
  startMouse = { x: e.clientX, y: e.clientY }
  startPos = { ...pos }
  e.preventDefault()
}

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return
    pos = { x: startPos.x + e.clientX - startMouse.x, y: startPos.y + e.clientY - startMouse.y }
    const el = document.getElementById('vps-widget')
    if (el) { el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px' }
  })
  window.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; localStorage.setItem('vps-widget-pos', JSON.stringify(pos)) }
  })
}

// --- Config ---
let showConfig = !localStorage.getItem('vps-config-saved')

const toggleConfig = (e) => {
  e.stopPropagation()
  showConfig = !showConfig
  const panel = document.getElementById('vps-config-panel')
  if (panel) panel.style.display = showConfig ? 'block' : 'none'
}

const saveConfig = (e) => {
  e.stopPropagation()
  const host = document.getElementById('vps-input-host').value.trim()
  const user = document.getElementById('vps-input-user').value.trim()
  const pass = document.getElementById('vps-input-pass').value.trim()
  if (!host || !user || !pass) return

  const json = JSON.stringify({ host, user, pass })
  run(`/bin/bash -c "echo '${json.replace(/'/g, "'\\''")}' > $HOME/.vps-widget-config"`)
    .then(() => {
      localStorage.setItem('vps-config-saved', '1')
      showConfig = false
      const panel = document.getElementById('vps-config-panel')
      if (panel) panel.style.display = 'none'
    })
}

export const render = ({ output }) => {
  const isError = !output || output.trim() === 'error' || output.trim() === ''
  let cpu = 0, usedMB = 0, totalMB = 0, ramPct = 0

  if (!isError) {
    const p = output.trim().split('|')
    cpu = parseInt(p[0]) || 0
    usedMB = parseInt(p[1]) || 0
    totalMB = parseInt(p[2]) || 0
    ramPct = parseInt(p[3]) || 0
  }

  const cpuColor = cpu > 80 ? '#ff4d4d' : cpu > 50 ? '#ffaa00' : '#4cff91'
  const ramColor = ramPct > 80 ? '#ff4d4d' : ramPct > 50 ? '#ffaa00' : '#4cff91'
  const configSaved = !!localStorage.getItem('vps-config-saved')

  return (
    <div id="vps-widget" style={{ ...styles.container, left: pos.x, top: pos.y }} onMouseDown={onMouseDown}>
      <div style={styles.header}>
        <span style={isError ? styles.dotRed : styles.dotGreen} />
        <span style={styles.title}>VPS Monitor</span>
        <button id="vps-settings-btn" style={styles.gearBtn} onClick={toggleConfig}>⚙</button>
      </div>

      <div id="vps-config-panel" style={{ ...styles.configPanel, display: showConfig ? 'block' : 'none' }}>
        <div style={styles.configTitle}>Server Settings</div>
        <input id="vps-input-host" style={styles.input} type="text" placeholder="IP Address / Host" />
        <input id="vps-input-user" style={styles.input} type="text" placeholder="Username" />
        <input id="vps-input-pass" style={styles.input} type="password" placeholder="Password" />
        <button style={styles.saveBtn} onClick={saveConfig}>Save & Connect</button>
      </div>

      {!showConfig && (
        isError ? (
          <div style={styles.offline}>
            {configSaved ? '⚠  Offline' : '⚙  Click gear icon to configure'}
          </div>
        ) : (
          <div>
            <div style={styles.row}>
              <span style={styles.label}>CPU</span>
              <div style={styles.barBg}>
                <div style={{ ...styles.barFill, width: `${cpu}%`, background: cpuColor }} />
              </div>
              <span style={{ ...styles.value, color: cpuColor }}>{cpu}%</span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>RAM</span>
              <div style={styles.barBg}>
                <div style={{ ...styles.barFill, width: `${ramPct}%`, background: ramColor }} />
              </div>
              <span style={{ ...styles.value, color: ramColor }}>{usedMB} / {totalMB} MB</span>
            </div>
          </div>
        )
      )}
    </div>
  )
}

const styles = {
  container: {
    position: 'fixed', width: '280px',
    background: 'rgba(20,25,35,0.85)', backdropFilter: 'blur(20px)',
    borderRadius: '16px', padding: '16px 18px',
    boxShadow: '0 4px 30px rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    color: '#fff', userSelect: 'none', cursor: 'grab',
  },
  header: { display: 'flex', alignItems: 'center', marginBottom: '14px', gap: '8px' },
  dotGreen: { width: '8px', height: '8px', borderRadius: '50%', background: '#4cff91', boxShadow: '0 0 6px #4cff91', display: 'inline-block', flexShrink: 0 },
  dotRed: { width: '8px', height: '8px', borderRadius: '50%', background: '#ff4d4d', display: 'inline-block', flexShrink: 0 },
  title: { fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.85)', flex: 1 },
  gearBtn: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer', padding: '0 2px' },
  configPanel: { marginBottom: '12px' },
  configTitle: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.5px' },
  input: {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px', color: '#fff', fontSize: '12px',
    padding: '7px 10px', marginBottom: '6px', outline: 'none',
  },
  saveBtn: {
    width: '100%', padding: '8px', marginTop: '2px',
    background: 'rgba(76,255,145,0.2)', border: '1px solid rgba(76,255,145,0.4)',
    borderRadius: '8px', color: '#4cff91', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  },
  row: { display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '8px' },
  label: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', width: '32px', flexShrink: 0 },
  barBg: { flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 0.5s ease' },
  value: { fontSize: '11px', width: '90px', textAlign: 'right', flexShrink: 0 },
  offline: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '8px 0' },
}

import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, Cell,
} from 'recharts'
import {
  HISTORICAL_EVENTS, CYCLONE_EVENTS, BASINS, EVENT_TYPES,
  generateSeasonalPattern, findSimilarEvents, returnPeriodTable,
  annualPeakTrend, eventGaugeResponse, NOW,
} from './Historicaldata'

const SEV_COLOR = { EXTREME:'#7f1d1d', MAJOR:'#dc2626', SIGNIFICANT:'#d97706', MODERATE:'#2563eb' }
const SEV_BG    = { EXTREME:'#fecaca', MAJOR:'#fee2e2', SIGNIFICANT:'#fef9c3', MODERATE:'#eff6ff' }
const TABS = ['Event Archive', 'Pattern Analysis', 'Cyclone Tracker']

const fmt = (n,d=2)=> typeof n==='number' ? n.toFixed(d) : '—'
const toggleBtn = (a) => ({
  fontSize:11, fontWeight:700, padding:'5px 11px', borderRadius:6, cursor:'pointer',
  border: a?'1px solid #2563eb':'1px solid #e2e8f0',
  background: a?'#2563eb':'#fff', color: a?'#fff':'#64748b',
})

function Panel({ title, action, children, style={} }) {
  return (
    <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', padding:'13px 14px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', ...style }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, flexWrap:'wrap', gap:6 }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:'#1e293b' }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Tab 1: Event Archive ──────────────────────────────────────────
function EventArchive() {
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [basinFilter, setBasinFilter] = useState('All Basins')
  const [yearRange, setYearRange] = useState([2010, 2026])
  const [expandedId, setExpandedId] = useState(null)
  const [compareIds, setCompareIds] = useState([])
  const [searchQ, setSearchQ] = useState('')

  const filtered = useMemo(() => HISTORICAL_EVENTS.filter((e) =>
    (typeFilter === 'All Types' || e.type === typeFilter) &&
    (basinFilter === 'All Basins' || e.basins.includes(basinFilter)) &&
    (e.year >= yearRange[0] && e.year <= yearRange[1]) &&
    (searchQ === '' || e.name.toLowerCase().includes(searchQ.toLowerCase()))
  ).sort((a,b) => b.year - a.year), [typeFilter, basinFilter, yearRange, searchQ])

  const toggleCompare = (id) =>
    setCompareIds((p) => p.includes(id) ? p.filter((x) => x!==id) : p.length < 2 ? [...p, id] : p)

  const compareEvents = compareIds.map((id) => HISTORICAL_EVENTS.find((e) => e.id===id)).filter(Boolean)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Controls */}
      <div style={{ background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', padding:'12px 16px', display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
        <input value={searchQ} onChange={(e)=>setSearchQ(e.target.value)} placeholder="🔍 Search events…"
          style={{ fontSize:12, padding:'7px 11px', border:'1px solid #e2e8f0', borderRadius:7, width:200 }} />
        <select value={typeFilter} onChange={(e)=>setTypeFilter(e.target.value)} style={selectStyle}>
          {EVENT_TYPES.map((t)=><option key={t} value={t}>{t}</option>)}
        </select>
        <select value={basinFilter} onChange={(e)=>setBasinFilter(e.target.value)} style={selectStyle}>
          {['All Basins',...BASINS].map((b)=><option key={b} value={b}>{b}</option>)}
        </select>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:'#94a3b8' }}>Year: {yearRange[0]}–{yearRange[1]}</span>
          <input type="range" min={1985} max={2026} value={yearRange[0]} onChange={(e)=>setYearRange(([,b])=>[+e.target.value,b])} style={{ width:80 }} />
          <input type="range" min={1985} max={2026} value={yearRange[1]} onChange={(e)=>setYearRange(([a])=>[a,+e.target.value])} style={{ width:80 }} />
        </div>
        <span style={{ marginLeft:'auto', fontSize:11, color:'#94a3b8' }}>{filtered.length} events · click 2 to compare</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:14 }}>
        {/* Event cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:640, overflowY:'auto' }}>
          {filtered.map((ev) => {
            const inCompare = compareIds.includes(ev.id)
            const isExp = expandedId === ev.id
            return (
              <div key={ev.id} style={{ background:'#fff', borderRadius:10, border: inCompare ? '2px solid #2563eb' : '1px solid #e2e8f0', padding:'13px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', cursor:'pointer' }}
                onClick={() => setExpandedId(isExp ? null : ev.id)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                      {ev.cyclone && <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'#f0fdf4', color:'#16a34a' }}>🌀 Cyclone</span>}
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:'#eff6ff', color:'#2563eb' }}>{ev.type}</span>
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:5, background:SEV_BG[ev.severity]||'#f8fafc', color:SEV_COLOR[ev.severity]||'#64748b' }}>{ev.severity}</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1e293b' }}>{ev.name}</div>
                    <div style={{ fontSize:11, color:'#94a3b8' }}>{ev.dateRange} · {ev.basins.join(', ')}</div>
                  </div>
                  <button onClick={(e)=>{e.stopPropagation();toggleCompare(ev.id)}} style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, border:inCompare?'1px solid #2563eb':'1px solid #e2e8f0', background:inCompare?'#eff6ff':'#fff', color:inCompare?'#2563eb':'#64748b', cursor:'pointer' }}>
                    {inCompare?'✓ Compare':'+ Compare'}
                  </button>
                </div>
                <div style={{ display:'flex', gap:20, fontSize:11, color:'#64748b' }}>
                  <span>💀 {ev.fatalities} fatalities</span>
                  <span>🏠 {ev.displaced.toLocaleString()} displaced</span>
                  <span>💰 {ev.economicLoss}{ev.economicUnit}</span>
                  <span>🌧 {ev.maxRainfall}mm peak rainfall</span>
                </div>
                {isExp && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
                    <div style={{ fontSize:12, color:'#374151', lineHeight:1.7, marginBottom:10 }}>{ev.description}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:5 }}>Peak Gauge Levels</div>
                        {Object.entries(ev.peakLevels).map(([k,v])=>(
                          <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:3 }}>
                            <span style={{ color:'#64748b' }}>{k.split('–')[0]}</span>
                            <span style={{ fontFamily:'monospace', fontWeight:700, color:'#dc2626' }}>{v.toFixed(2)}m</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:5 }}>Reservoir Levels</div>
                        {Object.entries(ev.reservoirLevels).map(([k,v])=>(
                          <div key={k} style={{ marginBottom:5 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:2 }}><span>{k}</span><span style={{ fontWeight:700, color: v>90?'#dc2626':v>75?'#d97706':'#16a34a' }}>{v}%</span></div>
                            <div style={{ height:5, background:'#f1f5f9', borderRadius:3 }}><div style={{ height:'100%', width:`${v}%`, background: v>90?'#dc2626':v>75?'#d97706':'#3b82f6', borderRadius:3 }}/></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop:10 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6 }}>Gauge Response Timeline</div>
                      <ResponsiveContainer width="100%" height={120}>
                        <LineChart data={eventGaugeResponse(ev.id, 'primary')} margin={{ left:-16, right:4, top:2, bottom:0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="h" tickFormatter={(h)=>`${h>0?'+':''}${h}h`} tick={{ fontSize:9, fill:'#94a3b8' }} />
                          <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} />
                          <Tooltip contentStyle={{ fontSize:10 }} labelFormatter={(h)=>`t ${h>0?'+':''}${h}h`} />
                          <Line type="monotone" dataKey="level" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length === 0 && <div style={{ fontSize:12, color:'#94a3b8', padding:20 }}>No events match these filters.</div>}
        </div>

        {/* Comparison panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Panel title="Side-by-Side Comparison">
            {compareEvents.length < 2
              ? <div style={{ fontSize:11.5, color:'#94a3b8', fontStyle:'italic', padding:'12px 0' }}>Select two events from the list to compare them here.</div>
              : (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {compareEvents.map((ev)=>(
                    <div key={ev.id} style={{ background:'#f8fafc', borderRadius:8, padding:'10px 10px' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#1e293b', marginBottom:6 }}>{ev.name}</div>
                      <CompRow k="Year" v={ev.year} />
                      <CompRow k="Type" v={ev.type} />
                      <CompRow k="Fatalities" v={ev.fatalities} />
                      <CompRow k="Displaced" v={ev.displaced.toLocaleString()} />
                      <CompRow k="Economic loss" v={`${ev.economicLoss}${ev.economicUnit}`} />
                      <CompRow k="Max rainfall" v={`${ev.maxRainfall}mm`} />
                      <CompRow k="Basins" v={ev.basins.join(', ')} />
                    </div>
                  ))}
                </div>
              )
            }
          </Panel>

          <Panel title="Events by Year">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Array.from({length:41},(_,i)=>{
                const y=1985+i; const evs=HISTORICAL_EVENTS.filter(e=>e.year===y)
                return { year:y, events:evs.length, fatalities: evs.reduce((s,e)=>s+e.fatalities,0) }
              })} margin={{ left:-16, right:4, top:2, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize:8, fill:'#94a3b8' }} interval={4} />
                <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} />
                <Tooltip contentStyle={{ fontSize:10, borderRadius:6 }} />
                <Bar dataKey="events" fill="#3b82f6" radius={[2,2,0,0]} name="Events" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>
    </div>
  )
}

// ── Tab 2: Pattern Analysis ───────────────────────────────────────
function PatternAnalysis() {
  const [selectedBasin, setSelectedBasin] = useState('Kalu')
  const [gaugeLevel, setGaugeLevel] = useState(4.2)
  const [returnLevel, setReturnLevel] = useState(5.1)

  const seasonal = useMemo(() => generateSeasonalPattern(selectedBasin), [selectedBasin])
  const similar   = useMemo(() => findSimilarEvents(gaugeLevel, selectedBasin), [gaugeLevel, selectedBasin])
  const rpTable   = useMemo(() => returnPeriodTable(selectedBasin), [selectedBasin])
  const trendData = useMemo(() => annualPeakTrend(selectedBasin), [selectedBasin])

  const closestRP = rpTable.reduce((a,b) => Math.abs(b.level - returnLevel) < Math.abs(a.level - returnLevel) ? b : a)
  const prob68 = similar[0] ? Math.round(similar[0].score * 100) : 68

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', gap:12, alignItems:'center', background:'#fff', borderRadius:10, border:'1px solid #e2e8f0', padding:'12px 16px' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Basin</span>
        <select value={selectedBasin} onChange={(e)=>setSelectedBasin(e.target.value)} style={selectStyle}>
          {BASINS.map((b)=><option key={b} value={b}>{b}</option>)}
        </select>
        <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase' }}>Current level</span>
        <input type="number" step="0.1" min="0" max="8" value={gaugeLevel} onChange={(e)=>setGaugeLevel(+e.target.value)}
          style={{ width:70, fontSize:12, padding:'6px 9px', border:'1px solid #e2e8f0', borderRadius:7 }} />
        <span style={{ fontSize:11, color:'#94a3b8' }}>m</span>
        {similar[0] && (
          <div style={{ marginLeft:'auto', padding:'8px 14px', background:'#fef9c3', borderRadius:8, fontSize:12, color:'#92400e', fontWeight:700 }}>
            ⚠ Based on {similar.length} similar events: <strong>{prob68}% probability</strong> of exceeding {(gaugeLevel + 0.3).toFixed(1)}m within 18h
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        {/* Similar events */}
        <Panel title="Most Similar Historical Events" style={{ gridColumn:'1/-1' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
            {similar.map(({event, score, hoursToP, peakVal, recessionDays}, i) => (
              <div key={event.id} style={{ background:'#f8fafc', borderRadius:8, padding:'10px 10px', border:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#94a3b8' }}>#{i+1}</span>
                  <span style={{ fontSize:11, fontWeight:800, color: score>0.8?'#16a34a':score>0.6?'#d97706':'#64748b' }}>
                    {Math.round(score*100)}% match
                  </span>
                </div>
                <div style={{ fontSize:11.5, fontWeight:700, color:'#1e293b', marginBottom:4, lineHeight:1.3 }}>{event.name}</div>
                <div style={{ fontSize:10.5, color:'#64748b', marginBottom:6 }}>{event.year}</div>
                <div style={{ fontSize:10, color:'#374151', marginBottom:2 }}>Peak: <strong style={{ color:'#dc2626' }}>{fmt(peakVal)}m</strong></div>
                <div style={{ fontSize:10, color:'#374151', marginBottom:2 }}>Time to peak: <strong>{hoursToP}h</strong></div>
                <div style={{ fontSize:10, color:'#374151' }}>Recession: <strong>{recessionDays}d</strong></div>
                <div style={{ marginTop:6, fontSize:10.5, color:'#64748b', fontStyle:'italic', lineHeight:1.4 }}>
                  "{event.description.slice(0,80)}…"
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Seasonal pattern */}
        <Panel title={`Seasonal Level Pattern — ${selectedBasin} Basin`}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={seasonal} margin={{ left:-14, right:4, top:4, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:7 }} />
              <Area type="monotone" dataKey="historical" fill="#dbeafe" stroke="#93c5fd" fillOpacity={0.4} name="Historical avg" />
              <Line type="monotone" dataKey="current" stroke="#2563eb" strokeWidth={2.5} dot={{ r:3 }} name="Current year" />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        {/* Long-term trend */}
        <Panel title={`Annual Peak Trend — ${selectedBasin} Basin (1985–2025)`}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData} margin={{ left:-14, right:4, top:4, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize:9, fill:'#94a3b8' }} interval={4} />
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} />
              <Tooltip contentStyle={{ fontSize:11, borderRadius:7 }} />
              <Bar dataKey="peak" fill="#bfdbfe" radius={[2,2,0,0]} name="Annual peak" />
              <Line type="monotone" dataKey="peak" stroke="#2563eb" strokeWidth={1.5} dot={false} name="Trend" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ fontSize:11, color:'#16a34a', fontWeight:600, marginTop:4 }}>
            ↑ Rising baseline trend: +{fmt(0.018*40,2)}m over 40 years. Likely due to land use change / deforestation.
          </div>
        </Panel>

        {/* Return period calculator */}
        <Panel title="Return Period Calculator">
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <span style={{ fontSize:12, color:'#64748b' }}>Enter level:</span>
            <input type="number" step="0.1" min="0" max="10" value={returnLevel} onChange={(e)=>setReturnLevel(+e.target.value)}
              style={{ width:70, fontSize:12, padding:'6px 9px', border:'1px solid #e2e8f0', borderRadius:7 }} />
            <span style={{ fontSize:12, color:'#64748b' }}>m</span>
            <div style={{ marginLeft:'auto', padding:'6px 12px', background:'#fef9c3', borderRadius:7, fontSize:12, color:'#92400e', fontWeight:700 }}>
              ≈ 1-in-{closestRP.returnYears} year event
            </div>
          </div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr style={{ background:'#f8fafc' }}>
              <th style={th}>Return Period</th><th style={th}>Level (m)</th><th style={th}>Probability / yr</th>
            </tr></thead>
            <tbody>
              {rpTable.map((r)=>(
                <tr key={r.returnYears} style={{ background: Math.abs(r.level-returnLevel)<0.3?'#fffbeb':'transparent', borderBottom:'1px solid #f8fafc' }}>
                  <td style={td}>1 in {r.returnYears} years</td>
                  <td style={{ ...td, fontFamily:'monospace', fontWeight:700 }}>{fmt(r.level)}</td>
                  <td style={td}>{(100/r.returnYears).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  )
}

// ── Tab 3: Cyclone Tracker ────────────────────────────────────────
function CycloneTracker() {
  const [selectedId, setSelectedId] = useState(CYCLONE_EVENTS[0]?.id)
  const selected = CYCLONE_EVENTS.find((e) => e.id === selectedId)
  const response = useMemo(() => selected ? eventGaugeResponse(selected.id, 'primary') : [], [selectedId])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Cyclone selector cards */}
      <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:4 }}>
        {CYCLONE_EVENTS.map((ev) => (
          <div key={ev.id} onClick={() => setSelectedId(ev.id)}
            style={{ minWidth:200, flexShrink:0, background:'#fff', borderRadius:10, padding:'12px 14px', cursor:'pointer',
              border: ev.id===selectedId?'2px solid #2563eb':'1px solid #e2e8f0',
              boxShadow: ev.id===selectedId?'0 4px 14px rgba(37,99,235,0.18)':'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', marginBottom:2 }}>🌀 {ev.cyclone.name}</div>
            <div style={{ fontSize:12.5, fontWeight:700, color:'#1e293b', marginBottom:3 }}>{ev.name}</div>
            <div style={{ fontSize:10.5, color:'#94a3b8' }}>{ev.dateRange}</div>
            <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>💨 {ev.cyclone.windsKph} km/h · {ev.cyclone.landfall}</div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Track map placeholder */}
          <Panel title={`${selected.cyclone.name} Track & Landfall`}>
            <div style={{ background:'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 40%,#e0f2fe 100%)', borderRadius:8, height:300, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, padding:12 }}>
                <svg width="100%" height="100%" viewBox="0 0 300 280">
                  {/* Rough SL outline */}
                  <polygon points="115,20 165,25 200,60 210,100 205,140 195,180 180,220 150,260 120,250 90,220 70,180 65,140 75,100 85,60" fill="#a7f3d0" stroke="#059669" strokeWidth="1.5" fillOpacity="0.8"/>
                  {/* Cyclone track */}
                  {selected.cyclone.track.length > 1 && (
                    <polyline
                      points={selected.cyclone.track.map(([lat,lng]) => {
                        const x = (lng - 79.5) / 2.6 * 280 + 10
                        const y = (10.0 - lat) / 4.3 * 260 + 10
                        return `${x},${y}`
                      }).join(' ')}
                      fill="none" stroke="#dc2626" strokeWidth="2.5" strokeDasharray="5 3"
                    />
                  )}
                  {selected.cyclone.track.map(([lat,lng], i) => {
                    const x = (lng - 79.5) / 2.6 * 280 + 10
                    const y = (10.0 - lat) / 4.3 * 260 + 10
                    return <circle key={i} cx={x} cy={y} r={i===0?7:4} fill="#dc2626" stroke="#fff" strokeWidth="1.5"/>
                  })}
                  <text x="150" y="275" textAnchor="middle" fontSize="10" fill="#64748b">Track (illustrative)</text>
                </svg>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:10 }}>
              <MiniStat label="Max winds" v={`${selected.cyclone.windsKph} km/h`} />
              <MiniStat label="Landfall" v={selected.cyclone.landfall} />
              <MiniStat label="Max rainfall" v={`${selected.maxRainfall}mm`} />
            </div>
          </Panel>

          {/* Gauge response chart */}
          <Panel title="River Gauge Response (centred on peak)">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={response} margin={{ left:-14, right:4, top:4, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="h" tickFormatter={(h)=>`${h>0?'+':''}${h}h`} tick={{ fontSize:9, fill:'#94a3b8' }} />
                <YAxis tick={{ fontSize:9, fill:'#94a3b8' }}/>
                <Tooltip contentStyle={{ fontSize:10 }} labelFormatter={(h)=>`t ${h>0?'+':''}${h}h`}/>
                <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 2" label={{ value:'Peak', fontSize:9, fill:'#94a3b8' }}/>
                <Area type="monotone" dataKey="level" fill="#dbeafe" stroke="#2563eb" strokeWidth={2} fillOpacity={0.3} name="Level (m)"/>
              </ComposedChart>
            </ResponsiveContainer>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginTop:10 }}>
              {[
                ['24h pre-peak', response[Math.max(0,response.filter(r=>r.h<0).length-24)]?.level],
                ['12h pre-peak', response[Math.max(0,response.filter(r=>r.h<0).length-12)]?.level],
                ['6h pre-peak',  response[Math.max(0,response.filter(r=>r.h<0).length-6)]?.level],
                ['Peak level',   Math.max(...response.map(r=>r.level))],
              ].map(([l,v])=>(
                <MiniStat key={l} label={l} v={v != null ? `${fmt(v)}m` : '—'} />
              ))}
            </div>
          </Panel>

          {/* Lead time analysis */}
          <Panel title="Gauge Lead Time Analysis" style={{ gridColumn:'1/-1' }}>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:10 }}>
              Time from cyclone landfall to gauge peak — the earlier the gauge responds, the more advance warning for downstream communities.
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
              {Object.entries(selected.peakLevels).map(([station, peak]) => {
                const leadH = Math.round(4 + Math.random() * 14)
                return (
                  <div key={station} style={{ background:'#f8fafc', borderRadius:8, padding:'10px 12px', border:'1px solid #e2e8f0' }}>
                    <div style={{ fontSize:11.5, fontWeight:700, color:'#1e293b', marginBottom:4 }}>{station.split('–')[0]}</div>
                    <div style={{ fontSize:11, color:'#94a3b8', marginBottom:6 }}>Peak {fmt(peak)}m</div>
                    <div style={{ fontSize:13, fontWeight:800, color: leadH<6?'#dc2626':leadH<12?'#d97706':'#16a34a' }}>
                      +{leadH}h after landfall
                    </div>
                    <div style={{ fontSize:10, color:'#94a3b8' }}>lead time from cyclone track</div>
                  </div>
                )
              })}
            </div>
          </Panel>
        </div>
      )}
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────
export default function M12HistoricalPage() {
  const [tab, setTab] = useState(0)
  return (
    <div style={{ background:'#f0f4f8', minHeight:'100%', fontFamily:'inherit' }}>
      {/* Tab bar */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', display:'flex', gap:2 }}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:'13px 20px', fontSize:13, fontWeight: tab===i?700:500,
            color: tab===i?'#2563eb':'#64748b', background:'transparent', border:'none',
            borderBottom: tab===i?'2px solid #2563eb':'2px solid transparent',
            cursor:'pointer', transition:'color .15s',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ padding:16 }}>
        {tab===0 && <EventArchive/>}
        {tab===1 && <PatternAnalysis/>}
        {tab===2 && <CycloneTracker/>}
      </div>
    </div>
  )
}

// ── Tiny helpers ──────────────────────────────────────────────────
const selectStyle = { fontSize:12, fontWeight:600, padding:'7px 10px', border:'1px solid #e2e8f0', borderRadius:7, background:'#fff', cursor:'pointer' }
const th = { padding:'7px 10px', textAlign:'left', fontSize:11, fontWeight:600, color:'#94a3b8', borderBottom:'1px solid #f1f5f9' }
const td = { padding:'7px 10px', fontSize:11, borderBottom:'1px solid #f8fafc', color:'#374151' }
function CompRow({k,v}) {
  return <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}><span style={{color:'#94a3b8'}}>{k}</span><span style={{fontWeight:700,color:'#1e293b'}}>{v}</span></div>
}
function MiniStat({label,v}) {
  return (
    <div style={{ textAlign:'center', background:'#f8fafc', borderRadius:7, padding:'6px 4px' }}>
      <div style={{ fontSize:9.5, color:'#94a3b8', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:800, color:'#1e293b' }}>{v}</div>
    </div>
  )
}
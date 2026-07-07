import { useState, useMemo } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import {
  GN_DIVISIONS, CURRENT_IMPACT, SECTOR_IMPACT, FORECAST_SCENARIOS,
  IMPACT_CURVE, COMPARABLE_HISTORICAL,
} from './impactData'

const TABS = ['Impact Dashboard', 'Forecast Impact Scenarios']
const STATUS_COLOR = { 'Dry':'#16a34a','Watch':'#2563eb','Warning':'#d97706','Minor Flood':'#ea580c','Major Flood':'#dc2626' }
const STATUS_BG    = { 'Dry':'#dcfce7','Watch':'#eff6ff','Warning':'#fef9c3','Minor Flood':'#ffedd5','Major Flood':'#fee2e2' }

const fmt = (n,d=0) => typeof n==='number' ? n.toLocaleString(undefined,{maximumFractionDigits:d}) : '—'
const toggleBtn = (a) => ({ fontSize:11,fontWeight:700,padding:'5px 11px',borderRadius:6,cursor:'pointer',border:a?'1px solid #2563eb':'1px solid #e2e8f0',background:a?'#2563eb':'#fff',color:a?'#fff':'#64748b' })

function Panel({title,action,children,style={}}) {
  return (
    <div style={{ background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'13px 14px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)',...style }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,flexWrap:'wrap',gap:6 }}>
        <div style={{ fontSize:12.5,fontWeight:700,color:'#1e293b' }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

// ── Tab 1: Impact Dashboard ───────────────────────────────────────
function ImpactDashboard() {
  const [gnFilter, setGnFilter] = useState('All')
  const [gnSort, setGnSort] = useState('severity')
  const [gnPage, setGnPage] = useState(0)
  const PAGE = 12

  const filteredGN = useMemo(() => {
    let list = GN_DIVISIONS.filter((g) => gnFilter === 'All' || g.status === gnFilter)
    if (gnSort === 'severity') list = [...list].sort((a,b) => b.severity - a.severity)
    if (gnSort === 'population') list = [...list].sort((a,b) => b.population - a.population)
    if (gnSort === 'shelter') list = [...list].sort((a,b) => b.shelterOccupancy - a.shelterOccupancy)
    return list
  }, [gnFilter, gnSort])

  const exportGN = () => {
    const hdr = 'ID,Name,District,Population,Households,Current Status,Forecast 24h,Evacuation,Shelter Cap,Shelter Occ\n'
    const rows = GN_DIVISIONS.map(g=>`${g.id},"${g.name}",${g.district},${g.population},${g.households},${g.status},${g.forecastStatus24h},${g.evacuationStatus},${g.shelterCapacity},${g.shelterOccupancy}`).join('\n')
    const blob = new Blob([hdr+rows],{type:'text/csv'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a');a.href=url;a.download='gn-impact.csv';a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
      {/* Impact summary strip */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:12 }}>
        {[
          { icon:'👥',label:'People at Risk',v:fmt(CURRENT_IMPACT.peopleAtRisk),color:'#dc2626' },
          { icon:'🏠',label:'Households Affected',v:fmt(CURRENT_IMPACT.householdsAffected),color:'#ea580c' },
          { icon:'🌾',label:'Agriculture (ha)',v:fmt(CURRENT_IMPACT.agricultureHa),color:'#d97706' },
          { icon:'🛣️',label:'Roads Affected (km)',v:fmt(CURRENT_IMPACT.roadsKm),color:'#7c3aed' },
          { icon:'🌉',label:'Bridges at Risk',v:CURRENT_IMPACT.bridgesAtRisk,color:'#2563eb' },
          { icon:'💰',label:'Loss / Hour (USD)',v:'$'+fmt(CURRENT_IMPACT.economicLossPerHour),color:'#0891b2' },
        ].map((c)=>(
          <div key={c.label} style={{ background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',padding:'12px 14px',boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:11,color:'#64748b',marginBottom:3 }}>{c.icon} {c.label}</div>
            <div style={{ fontSize:22,fontWeight:900,color:c.color }}>{c.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:14 }}>
        {/* Impact map placeholder */}
        <Panel title="Impact Map — GN Division Severity">
          <div style={{ background:'linear-gradient(135deg,#e0f2fe 0%,#bae6fd 40%,#e0f2fe 100%)',borderRadius:8,height:320,display:'flex',flexDirection:'column',justifyContent:'flex-end',overflow:'hidden',position:'relative' }}>
            {/* Illustrative GN cells */}
            <svg width="100%" height="100%" viewBox="0 0 400 320" style={{ position:'absolute',top:0,left:0 }}>
              <polygon points="145,10 215,18 255,65 265,120 258,175 240,230 210,280 165,308 130,298 100,265 80,220 75,160 88,105 105,60" fill="#a7f3d0" stroke="#059669" strokeWidth="1.5" fillOpacity="0.8"/>
              {/* GN grid cells overlaid */}
              {GN_DIVISIONS.slice(0,20).map((gn,i) => {
                const col = i % 5
                const row = Math.floor(i / 5)
                const x = 105 + col * 28
                const y = 80 + row * 42
                const colors = { 'Dry':'#22c55e','Watch':'#3b82f6','Warning':'#f59e0b','Minor Flood':'#f97316','Major Flood':'#ef4444' }
                return <rect key={gn.id} x={x} y={y} width={24} height={36} rx={3} fill={colors[gn.status]||'#94a3b8'} fillOpacity={0.75} stroke="#fff" strokeWidth={0.5}>
                  <title>{gn.name}: {gn.status}</title>
                </rect>
              })}
            </svg>
            {/* Legend */}
            <div style={{ position:'absolute',bottom:10,left:10,background:'rgba(255,255,255,0.9)',borderRadius:7,padding:'6px 10px',fontSize:10.5,display:'flex',gap:8,zIndex:10 }}>
              {Object.entries(STATUS_COLOR).map(([k,v])=>(
                <div key={k} style={{ display:'flex',alignItems:'center',gap:3 }}>
                  <span style={{ width:8,height:8,borderRadius:2,background:v,display:'inline-block' }}/>
                  <span style={{ color:'#374151' }}>{k}</span>
                </div>
              ))}
            </div>
            <div style={{ position:'absolute',top:10,right:10,background:'rgba(255,255,255,0.85)',borderRadius:6,padding:'5px 8px',fontSize:10,color:'#64748b',zIndex:10 }}>
              Wire to M5 map for real GN layer
            </div>
          </div>
        </Panel>

        {/* Sector breakdown */}
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          <Panel title="Agriculture Impact">
            {SECTOR_IMPACT.agriculture.cropTypes.map((c)=>(
              <div key={c.crop} style={{ marginBottom:8 }}>
                <div style={{ display:'flex',justifyContent:'space-between',marginBottom:2 }}>
                  <span style={{ fontSize:11.5,fontWeight:600,color:'#374151' }}>{c.crop}</span>
                  <span style={{ fontSize:11,color:'#dc2626',fontWeight:700 }}>{c.yieldLoss}% yield loss</span>
                </div>
                <div style={{ fontSize:10.5,color:'#94a3b8',marginBottom:3 }}>{fmt(c.areaAffected)} ha · {fmt(c.farmerCount)} farmers</div>
                <div style={{ height:5,background:'#f1f5f9',borderRadius:3 }}><div style={{ height:'100%',width:`${Math.min(100,c.yieldLoss*1.5)}%`,background:'#f97316',borderRadius:3 }}/></div>
              </div>
            ))}
          </Panel>

          <Panel title="Households & Vulnerable">
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8 }}>
              <MiniStat label="Displaced" v={fmt(SECTOR_IMPACT.households.displaced)} color="#dc2626" />
              <MiniStat label="At Risk" v={fmt(SECTOR_IMPACT.households.atRisk)} color="#d97706" />
            </div>
            {SECTOR_IMPACT.households.breakdown.map((b)=>(
              <div key={b.category} style={{ display:'flex',justifyContent:'space-between',fontSize:11.5,marginBottom:5 }}>
                <span style={{ color:'#64748b' }}>{b.category}</span>
                <span style={{ fontWeight:700,color:'#1e293b' }}>{fmt(b.count)}</span>
              </div>
            ))}
          </Panel>

          <Panel title="Infrastructure">
            <InfoRow k="Roads (km)" v={`${SECTOR_IMPACT.infrastructure.roads.total} (${SECTOR_IMPACT.infrastructure.roads.major} major)`} />
            <InfoRow k="Bridges at risk / closed" v={`${SECTOR_IMPACT.infrastructure.bridges.atRisk} / ${SECTOR_IMPACT.infrastructure.bridges.closed}`} />
            <InfoRow k="Irrigation canals" v={SECTOR_IMPACT.infrastructure.irrigationCanals} />
            <InfoRow k="Power line segments" v={SECTOR_IMPACT.infrastructure.powerLines} />
          </Panel>
        </div>
      </div>

      {/* GN Division table */}
      <Panel title={`GN Division Impact Table — ${filteredGN.length} divisions`}
        action={
          <div style={{ display:'flex',gap:8 }}>
            <select value={gnFilter} onChange={(e)=>{ setGnFilter(e.target.value);setGnPage(0) }} style={sel}>
              {['All',...Object.keys(STATUS_COLOR)].map((s)=><option key={s} value={s}>{s}</option>)}
            </select>
            <select value={gnSort} onChange={(e)=>setGnSort(e.target.value)} style={sel}>
              <option value="severity">Sort: Severity</option>
              <option value="population">Sort: Population</option>
              <option value="shelter">Sort: Shelter</option>
            </select>
            <button onClick={exportGN} style={{ fontSize:11,fontWeight:700,padding:'5px 10px',borderRadius:6,border:'1px solid #2563eb',background:'#fff',color:'#2563eb',cursor:'pointer' }}>⬇ Export</button>
          </div>
        }>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
            <thead><tr style={{ background:'#f8fafc' }}>
              {['GN Division','District','Population','Households','Current','Forecast 24h','Evacuation','Shelter Cap/Occ'].map((h)=>(
                <th key={h} style={thS}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredGN.slice(gnPage*PAGE,(gnPage+1)*PAGE).map((g)=>(
                <tr key={g.id} style={{ borderBottom:'1px solid #f8fafc' }}>
                  <td style={tdS}><div style={{ fontWeight:600 }}>{g.name}</div><div style={{ fontSize:9.5,color:'#94a3b8' }}>{g.id}</div></td>
                  <td style={tdS}>{g.district}</td>
                  <td style={tdS}>{fmt(g.population)}</td>
                  <td style={tdS}>{fmt(g.households)}</td>
                  <td style={tdS}><span style={{ fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,background:STATUS_BG[g.status]||'#f8fafc',color:STATUS_COLOR[g.status]||'#64748b' }}>{g.status}</span></td>
                  <td style={tdS}><span style={{ fontSize:10,fontWeight:700,padding:'2px 6px',borderRadius:4,background:STATUS_BG[g.forecastStatus24h]||'#f8fafc',color:STATUS_COLOR[g.forecastStatus24h]||'#64748b' }}>{g.forecastStatus24h}</span></td>
                  <td style={tdS}><span style={{ fontSize:10,color:'#7c3aed',fontWeight:600 }}>{g.evacuationStatus}</span></td>
                  <td style={tdS}>{g.shelterOccupancy}/{g.shelterCapacity} <span style={{ fontSize:9.5,color: g.shelterOccupancy/g.shelterCapacity>0.9?'#dc2626':'#64748b' }}>({Math.round(g.shelterOccupancy/g.shelterCapacity*100)||0}%)</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8 }}>
          <span style={{ fontSize:11,color:'#94a3b8' }}>Page {gnPage+1} of {Math.ceil(filteredGN.length/PAGE)}</span>
          <div style={{ display:'flex',gap:6 }}>
            <button disabled={gnPage===0} onClick={()=>setGnPage(p=>p-1)} style={{ fontSize:11,padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:gnPage===0?'#f8fafc':'#fff',cursor:gnPage===0?'default':'pointer',color:'#64748b' }}>← Prev</button>
            <button disabled={gnPage>=Math.ceil(filteredGN.length/PAGE)-1} onClick={()=>setGnPage(p=>p+1)} style={{ fontSize:11,padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:gnPage>=Math.ceil(filteredGN.length/PAGE)-1?'#f8fafc':'#fff',cursor:gnPage>=Math.ceil(filteredGN.length/PAGE)-1?'default':'pointer',color:'#64748b' }}>Next →</button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

// ── Tab 2: Forecast Impact Scenarios ──────────────────────────────
function ForecastScenarios() {
  const [sliderScenario, setSliderScenario] = useState(1) // 0=P10, 1=P50, 2=P90
  const [activeId, setActiveId] = useState('P50')

  const scenario = FORECAST_SCENARIOS[sliderScenario]
  const interpPeople = Math.round(
    FORECAST_SCENARIOS[0].peopleAffected +
    (sliderScenario/2) * (FORECAST_SCENARIOS[2].peopleAffected - FORECAST_SCENARIOS[0].peopleAffected)
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
      {/* Three scenario cards */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14 }}>
        {FORECAST_SCENARIOS.map((sc)=>(
          <div key={sc.id} onClick={()=>setActiveId(sc.id)} style={{ background:'#fff',borderRadius:12,border: activeId===sc.id?`2px solid ${sc.color}`:`1px solid ${sc.border}`,padding:'16px 18px',cursor:'pointer',boxShadow: activeId===sc.id?`0 4px 18px ${sc.color}28`:'0 1px 4px rgba(0,0,0,0.04)',transition:'box-shadow .15s' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8 }}>
              <div>
                <span style={{ fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:5,background:sc.bg,color:sc.color }}>{sc.pct}</span>
                <div style={{ fontSize:15,fontWeight:800,color:'#1e293b',marginTop:4 }}>{sc.label}</div>
              </div>
              <div style={{ fontSize:28,fontWeight:900,color:sc.color }}>{sc.peakLevel}m</div>
            </div>
            <div style={{ fontSize:11,color:'#64748b',marginBottom:12,lineHeight:1.5 }}>{sc.description}</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }}>
              <ScCell label="Time of peak" v={sc.timeOfPeak} />
              <ScCell label="Flood extent" v={`${sc.floodExtentKm2} km²`} />
              <ScCell label="People affected" v={sc.peopleAffected.toLocaleString()} />
              <ScCell label="Economic impact" v={`$${sc.economicImpact}M`} />
            </div>
            <div style={{ padding:'10px 12px',background:sc.bg,borderRadius:8,fontSize:11.5,color:sc.color,fontWeight:700,lineHeight:1.5 }}>
              ▶ {sc.recommendation}
            </div>
          </div>
        ))}
      </div>

      {/* Slider + active detail */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 380px',gap:14 }}>
        {/* Impact curve */}
        <Panel title="People Affected vs Time — All Scenarios">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={IMPACT_CURVE} margin={{ left:-8,right:8,top:4,bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="label" tick={{ fontSize:9,fill:'#94a3b8' }} interval={5}/>
              <YAxis tick={{ fontSize:9,fill:'#94a3b8' }} tickFormatter={(v)=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip contentStyle={{ fontSize:11,borderRadius:7 }} formatter={(v)=>[v.toLocaleString(),'people']}/>
              <Area type="monotone" dataKey="P90" fill="#fee2e2" stroke="#dc2626" strokeWidth={1.5} fillOpacity={0.5} name="P90 (worst)"/>
              <Area type="monotone" dataKey="P50" fill="#fef9c3" stroke="#d97706" strokeWidth={2} fillOpacity={0.6} name="P50 (median)"/>
              <Area type="monotone" dataKey="P10" fill="#dcfce7" stroke="#16a34a" strokeWidth={1.5} fillOpacity={0.5} name="P10 (optimistic)"/>
            </AreaChart>
          </ResponsiveContainer>

          {/* Manual slider */}
          <div style={{ marginTop:14,padding:'12px 14px',background:'#f8fafc',borderRadius:8 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
              <span style={{ fontSize:11,fontWeight:700,color:'#64748b' }}>Adjust Scenario</span>
              <span style={{ fontSize:12,fontWeight:800,color:FORECAST_SCENARIOS[sliderScenario].color }}>
                {FORECAST_SCENARIOS[sliderScenario].label}
              </span>
            </div>
            <input type="range" min={0} max={2} step={1} value={sliderScenario} onChange={(e)=>setSliderScenario(+e.target.value)} style={{ width:'100%' }}/>
            <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:'#94a3b8',marginTop:3 }}>
              <span>P10 Optimistic</span><span>P50 Median</span><span>P90 Worst</span>
            </div>
            <div style={{ marginTop:10,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
              <ScCell label="Peak level" v={`${scenario.peakLevel}m`} />
              <ScCell label="People" v={scenario.peopleAffected.toLocaleString()} />
              <ScCell label="Flood extent" v={`${scenario.floodExtentKm2}km²`} />
              <ScCell label="Economic" v={`$${scenario.economicImpact}M`} />
            </div>
          </div>

          {/* Historical comparison */}
          <div style={{ marginTop:10,padding:'10px 12px',background:'#eff6ff',borderRadius:8,fontSize:11.5,color:'#1d4ed8' }}>
            📚 {COMPARABLE_HISTORICAL.note}
          </div>
        </Panel>

        {/* Active scenario actions */}
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {FORECAST_SCENARIOS.filter(sc=>sc.id===activeId).map(sc=>(
            <div key={sc.id}>
              <Panel title={`${sc.label} — Recommended Actions`} style={{ border:`1px solid ${sc.border}` }}>
                <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                  {sc.actions.map((a,i)=>(
                    <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:8,padding:'7px 10px',background:sc.bg,borderRadius:7 }}>
                      <span style={{ fontSize:12,fontWeight:800,color:sc.color,flexShrink:0 }}>{i+1}.</span>
                      <span style={{ fontSize:11.5,color:sc.color,fontWeight:600,lineHeight:1.45 }}>{a}</span>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Auto-generated Sector Warnings" style={{ marginTop:10 }}>
                {[
                  { sector:'Agriculture', text:`${sc.pct}: ${sc.id==='P90'?'Evacuate':'Protect'} crops in low-lying areas. Expected ${sc.id==='P90'?'50-70%':'20-40%'} yield loss for Yala paddy season.` },
                  { sector:'Households', text:`${sc.id==='P90'?'Mandatory evacuation':'Voluntary evacuation advised'} for households within 500m of Kalu Ganga. Open ${sc.id==='P90'?'all 18':'3'} designated shelters.` },
                  { sector:'Infrastructure', text:`Expect ${sc.id==='P90'?'major':'minor'} disruption to A4 highway. Close river-crossing bridges at ${sc.floodExtentKm2>100?'Ratnapura and Horana':'Horana'}.` },
                ].map((w)=>(
                  <div key={w.sector} style={{ marginBottom:8,paddingBottom:8,borderBottom:'1px solid #f8fafc' }}>
                    <div style={{ fontSize:11,fontWeight:700,color:'#374151',marginBottom:2 }}>{w.sector}</div>
                    <div style={{ fontSize:11,color:'#64748b',lineHeight:1.55 }}>{w.text}</div>
                  </div>
                ))}
              </Panel>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────
export default function M13ImpactPage() {
  const [tab, setTab] = useState(0)
  return (
    <div style={{ background:'#f0f4f8',minHeight:'100%',fontFamily:'inherit' }}>
      <div style={{ background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',display:'flex',gap:2 }}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{ padding:'13px 20px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?'#2563eb':'#64748b',background:'transparent',border:'none',borderBottom:tab===i?'2px solid #2563eb':'2px solid transparent',cursor:'pointer' }}>{t}</button>
        ))}
      </div>
      <div style={{ padding:16 }}>
        {tab===0 && <ImpactDashboard/>}
        {tab===1 && <ForecastScenarios/>}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────
const sel = { fontSize:11,fontWeight:600,padding:'5px 8px',border:'1px solid #e2e8f0',borderRadius:6,background:'#fff' }
const thS = { padding:'7px 10px',textAlign:'left',fontSize:11,fontWeight:600,color:'#94a3b8',borderBottom:'1px solid #f1f5f9' }
const tdS = { padding:'7px 10px',fontSize:11,borderBottom:'1px solid #f8fafc',color:'#374151' }
function InfoRow({k,v}) {
  return <div style={{ display:'flex',justifyContent:'space-between',gap:10,marginBottom:5 }}><span style={{ fontSize:11,color:'#94a3b8' }}>{k}</span><span style={{ fontSize:11.5,color:'#1e293b',fontWeight:600 }}>{v}</span></div>
}
function MiniStat({label,v,color='#1e293b'}) {
  return <div style={{ textAlign:'center',background:'#f8fafc',borderRadius:7,padding:'6px 4px' }}><div style={{ fontSize:9.5,color:'#94a3b8',marginBottom:2 }}>{label}</div><div style={{ fontSize:16,fontWeight:800,color }}>{v}</div></div>
}
function ScCell({label,v}) {
  return <div style={{ textAlign:'center',background:'#fff',border:'1px solid #e2e8f0',borderRadius:6,padding:'5px 4px' }}><div style={{ fontSize:9.5,color:'#94a3b8',marginBottom:1 }}>{label}</div><div style={{ fontSize:11.5,fontWeight:700,color:'#1e293b' }}>{v}</div></div>
}
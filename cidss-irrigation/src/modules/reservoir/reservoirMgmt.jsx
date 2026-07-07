import { useState, useMemo } from 'react'
import { BarChart, Bar, LineChart, Line, ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import {
  RESERVOIRS, FLOOD_PROBABILITY_TABLE, RESERVOIR_HISTORICAL_EVENTS,
  inflowTrend, computeReleasePlan, IRRIGATION_PLANS, SEASONAL_FORECAST_NOTE,
} from './reservoirData'

const TABS = ['Live Storage Overview', 'Flood History & Risk', 'Release Decision Support', 'Irrigation & Water Planning']
const fmt = (n,d=1) => typeof n==='number' ? n.toFixed(d) : '—'
const pctColor = (p) => p>90?'#dc2626':p>75?'#d97706':'#3b82f6'
const pctBg    = (p) => p>90?'#fee2e2':p>75?'#fef9c3':'#eff6ff'

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

function InfoRow({k,v}) {
  return <div style={{ display:'flex',justifyContent:'space-between',gap:10,marginBottom:5 }}><span style={{ fontSize:11,color:'#94a3b8' }}>{k}</span><span style={{ fontSize:11.5,color:'#1e293b',fontWeight:600,textAlign:'right' }}>{v}</span></div>
}

function StorageGauge({ pct, size=80 }) {
  const angle = -225 + (pct/100)*270
  const r=size/2-6, cx=size/2, cy=size/2
  const toXY = (deg) => ({ x: cx+r*Math.cos(deg*Math.PI/180), y: cy+r*Math.sin(deg*Math.PI/180) })
  const start = toXY(-225), end = toXY(angle)
  const largeArc = (angle-(-225))>180?1:0
  const color = pctColor(pct)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={`M ${toXY(-225).x} ${toXY(-225).y} A ${r} ${r} 0 1 1 ${toXY(45).x} ${toXY(45).y}`} fill="none" stroke="#f1f5f9" strokeWidth={8} strokeLinecap="round"/>
      <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round"/>
      <text x={cx} y={cy+4} textAnchor="middle" fontSize={size*0.22} fontWeight="900" fill={color}>{pct}%</text>
    </svg>
  )
}

// ── Tab 1: Live Storage Overview ──────────────────────────────────
function LiveStorage({ selectedId, setSelectedId }) {
  const r = RESERVOIRS.find((x)=>x.id===selectedId)
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12 }}>
        {RESERVOIRS.map((res)=>(
          <div key={res.id} onClick={()=>setSelectedId(res.id)}
            style={{ background:'#fff',borderRadius:10,border: res.id===selectedId?'2px solid #2563eb':'1px solid #e2e8f0',padding:'14px 16px',cursor:'pointer',boxShadow: res.id===selectedId?'0 4px 14px rgba(37,99,235,0.18)':'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:14,fontWeight:700,color:'#1e293b' }}>{res.name}</div>
                <div style={{ fontSize:11,color:'#94a3b8' }}>{res.river} · {res.basin}</div>
              </div>
              <StorageGauge pct={res.pct} size={68}/>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginTop:10 }}>
              <div style={{ textAlign:'center',background:'#f8fafc',borderRadius:6,padding:'5px' }}>
                <div style={{ fontSize:9.5,color:'#94a3b8' }}>Storage (Mm³)</div>
                <div style={{ fontSize:12,fontWeight:700,color:'#1e293b' }}>{res.current}/{res.capacity}</div>
              </div>
              <div style={{ textAlign:'center',background:'#f8fafc',borderRadius:6,padding:'5px' }}>
                <div style={{ fontSize:9.5,color:'#94a3b8' }}>Inflow (m³/s)</div>
                <div style={{ fontSize:12,fontWeight:700,color:'#16a34a' }}>{res.currentInflow}</div>
              </div>
              <div style={{ textAlign:'center',background:'#f8fafc',borderRadius:6,padding:'5px' }}>
                <div style={{ fontSize:9.5,color:'#94a3b8' }}>Release (m³/s)</div>
                <div style={{ fontSize:12,fontWeight:700,color:'#2563eb' }}>{res.currentRelease}</div>
              </div>
            </div>
            {res.pct>90 && <div style={{ marginTop:8,fontSize:11,fontWeight:700,color:'#dc2626',background:'#fee2e2',borderRadius:6,padding:'4px 8px' }}>⚠ Spill risk — {res.pct}% storage</div>}
          </div>
        ))}
      </div>
      {r && (
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
          <Panel title={`${r.name} — Inflow Trend (30 days)`}>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={inflowTrend(r.id)} margin={{ left:-14,right:4,top:2,bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="day" tick={false}/>
                <YAxis tick={{ fontSize:9,fill:'#94a3b8' }}/>
                <Tooltip contentStyle={{ fontSize:10,borderRadius:7 }} labelFormatter={()=>''}/>
                <Area type="monotone" dataKey="historicalAvg" fill="#dbeafe" stroke="#93c5fd" fillOpacity={0.4} name="Historical avg"/>
                <Line type="monotone" dataKey="inflow" stroke="#2563eb" strokeWidth={2} dot={false} name="This season"/>
              </ComposedChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title={`${r.name} — Operational Details`}>
            <InfoRow k="Spillway capacity" v={`${r.spillwayCapacity} m³/s`}/>
            <InfoRow k="Current inflow" v={`${r.currentInflow} m³/s`}/>
            <InfoRow k="Current release" v={`${r.currentRelease} m³/s`}/>
            <InfoRow k="Min release (env. flow)" v={`${r.minRelease} m³/s`}/>
            <InfoRow k="Max safe downstream release" v={`${r.maxSafeRelease} m³/s`}/>
            <InfoRow k="Storage balance" v={<span style={{ color: r.currentInflow>r.currentRelease?'#dc2626':'#16a34a',fontWeight:700 }}>{r.currentInflow>r.currentRelease?`+${r.currentInflow-r.currentRelease} m³/s (filling)`:`${r.currentInflow-r.currentRelease} m³/s (drawing)`}</span>}/>
          </Panel>
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Flood History & Risk ───────────────────────────────────
function FloodHistoryRisk({ selectedId }) {
  const r = RESERVOIRS.find((x)=>x.id===selectedId)
  const events = RESERVOIR_HISTORICAL_EVENTS[selectedId] || []
  const inflow = inflowTrend(selectedId)
  if (!r) return null

  const currentRow = FLOOD_PROBABILITY_TABLE.find((row) =>
    (row.low <= r.pct) && (row.high == null ? true : r.pct < row.high)
  ) || FLOOD_PROBABILITY_TABLE[FLOOD_PROBABILITY_TABLE.length-1]

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
        {/* Probability table */}
        <Panel title={`Downstream Flood Probability — ${r.name}`}>
          <div style={{ fontSize:11,color:'#64748b',marginBottom:10,lineHeight:1.6 }}>
            Based on historical records: probability of downstream gauge exceeding flood level given current reservoir storage.
          </div>
          <table style={{ width:'100%',borderCollapse:'collapse',fontSize:12 }}>
            <thead><tr style={{ background:'#f8fafc' }}>
              <th style={th}>Storage %</th><th style={th}>Flood Probability</th><th style={th}>Risk Level</th>
            </tr></thead>
            <tbody>
              {FLOOD_PROBABILITY_TABLE.map((row)=>{
                const isCurrent = row === currentRow
                const risk = row.probability>=84?'Critical':row.probability>=55?'High':row.probability>=32?'Moderate':row.probability>=18?'Low':'Very Low'
                const riskColor = row.probability>=84?'#dc2626':row.probability>=55?'#ea580c':row.probability>=32?'#d97706':row.probability>=18?'#2563eb':'#16a34a'
                return (
                  <tr key={row.range} style={{ background: isCurrent?'#fffbeb':'transparent', borderBottom:'1px solid #f8fafc', fontWeight: isCurrent?700:400 }}>
                    <td style={td}>{row.range} {isCurrent&&<span style={{ marginLeft:4,fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:4,background:'#fef9c3',color:'#92400e' }}>← current ({r.pct}%)</span>}</td>
                    <td style={{ ...td,fontFamily:'monospace' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <div style={{ flex:1,height:7,background:'#f1f5f9',borderRadius:3 }}><div style={{ height:'100%',width:`${row.probability}%`,background:riskColor,borderRadius:3 }}/></div>
                        <span style={{ fontWeight:700,color:riskColor,minWidth:34 }}>{row.probability}%</span>
                      </div>
                    </td>
                    <td style={{ ...td,color:riskColor,fontWeight:700 }}>{risk}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div style={{ marginTop:10,padding:'10px 12px',background: currentRow.probability>=71?'#fee2e2':currentRow.probability>=32?'#fef9c3':'#dcfce7',borderRadius:8,fontSize:12,fontWeight:700,color: currentRow.probability>=71?'#dc2626':currentRow.probability>=32?'#92400e':'#15803d' }}>
            At {r.pct}% storage: <strong>{currentRow.probability}%</strong> probability of downstream flood. Recommend {currentRow.probability>=71?'prepare spillway operation plan and issue downstream advisory':'continue monitoring'}.
          </div>
        </Panel>

        {/* Inflow vs historical */}
        <Panel title={`${r.name} Inflow — This Season vs Historical`}>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={inflow} margin={{ left:-14,right:4,top:4,bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="day" tick={false}/>
              <YAxis tick={{ fontSize:9,fill:'#94a3b8' }}/>
              <Tooltip contentStyle={{ fontSize:10,borderRadius:7 }}/>
              <Area type="monotone" dataKey="historicalAvg" fill="#dbeafe" stroke="#93c5fd" fillOpacity={0.5} name="Historical avg"/>
              <Line type="monotone" dataKey="inflow" stroke="#2563eb" strokeWidth={2.5} dot={false} name="Current season"/>
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Historical events */}
      <Panel title={`Historical Events — ${r.name} Release Contribution`}>
        {events.length === 0 ? (
          <div style={{ fontSize:11.5,color:'#94a3b8',fontStyle:'italic' }}>No historical release events recorded for this reservoir in the dataset.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse',fontSize:11 }}>
              <thead><tr style={{ background:'#f8fafc' }}>
                {['Date','Storage at time','Release (m³/s)','Downstream peak','Gauge','Hours to peak','Affected','Note'].map((h)=>(
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {events.map((e,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid #f8fafc' }}>
                    <td style={{ ...td,fontFamily:'monospace' }}>{e.date}</td>
                    <td style={{ ...td,fontWeight:700,color: e.storage>90?'#dc2626':'#d97706' }}>{e.storage}%</td>
                    <td style={{ ...td,fontFamily:'monospace' }}>{e.releaseM3s}</td>
                    <td style={{ ...td,fontFamily:'monospace',fontWeight:700,color:'#dc2626' }}>{e.downstreamPeak}m</td>
                    <td style={td}>{e.gauge.split('–')[0]}</td>
                    <td style={{ ...td,fontWeight:700,color: e.hoursToP<=4?'#dc2626':'#16a34a' }}>{e.hoursToP}h</td>
                    <td style={td}>{e.affected.toLocaleString()}</td>
                    <td style={{ ...td,color:'#64748b',maxWidth:180,fontSize:10,fontStyle:'italic' }}>{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}

// ── Tab 3: Release Decision Support ──────────────────────────────
function ReleaseDecision({ selectedId }) {
  const r = RESERVOIRS.find((x)=>x.id===selectedId)
  const [proposedRelease, setProposedRelease] = useState(r?.currentRelease||200)
  const [durationHours, setDurationHours]     = useState(6)
  const [submitted, setSubmitted]             = useState(false)
  const [approvalNote, setApprovalNote]       = useState('')
  const [approved, setApproved]               = useState(false)

  const plan = useMemo(() => computeReleasePlan(selectedId, proposedRelease, durationHours), [selectedId, proposedRelease, durationHours])
  if (!r||!plan) return null

  const excColor = plan.excMajor>=0.7?'#dc2626':plan.excMajor>=0.4?'#d97706':'#16a34a'

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
        {/* Input form */}
        <Panel title={`Release Plan — ${r.name}`}>
          <div style={{ display:'flex',justifyContent:'center',marginBottom:14 }}>
            <StorageGauge pct={r.pct} size={120}/>
          </div>
          <InfoRow k="Current storage" v={`${r.current} Mm³ (${r.pct}%)`}/>
          <InfoRow k="Current inflow" v={`${r.currentInflow} m³/s`}/>
          <InfoRow k="Max safe release" v={`${r.maxSafeRelease} m³/s`}/>

          <div style={{ marginTop:14 }}>
            <label style={{ fontSize:11,fontWeight:700,color:'#64748b',display:'block',marginBottom:4 }}>Proposed release rate (m³/s)</label>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <input type="range" min={r.minRelease} max={r.maxSafeRelease*1.2} value={proposedRelease} onChange={(e)=>{setProposedRelease(+e.target.value);setSubmitted(false);setApproved(false)}} style={{ flex:1 }}/>
              <input type="number" value={proposedRelease} onChange={(e)=>{setProposedRelease(+e.target.value);setSubmitted(false);setApproved(false)}} style={{ width:70,fontSize:12,padding:'6px 8px',border:'1px solid #e2e8f0',borderRadius:7 }}/>
              <span style={{ fontSize:11,color:'#94a3b8' }}>m³/s</span>
            </div>
            {proposedRelease>r.maxSafeRelease && <div style={{ fontSize:11,color:'#dc2626',fontWeight:700,marginTop:4 }}>⚠ Exceeds safe downstream limit ({r.maxSafeRelease} m³/s)</div>}
          </div>

          <div style={{ marginTop:10 }}>
            <label style={{ fontSize:11,fontWeight:700,color:'#64748b',display:'block',marginBottom:4 }}>Duration (hours)</label>
            <div style={{ display:'flex',gap:8 }}>
              {[3,6,12,24].map((h)=>(
                <button key={h} onClick={()=>setDurationHours(h)} style={{ flex:1,padding:'6px',fontSize:11,fontWeight:700,borderRadius:6,border:durationHours===h?'1px solid #2563eb':'1px solid #e2e8f0',background:durationHours===h?'#eff6ff':'#fff',color:durationHours===h?'#2563eb':'#64748b',cursor:'pointer' }}>{h}h</button>
              ))}
            </div>
          </div>

          <div style={{ marginTop:12,padding:'10px 12px',background:'#f8fafc',borderRadius:8 }}>
            <InfoRow k="Storage after release" v={`${plan.newPct}% (${fmt(r.current - plan.storageDropMm3,1)} Mm³)`}/>
            <InfoRow k="ML recommended rate" v={<span style={{ color:'#16a34a',fontWeight:700 }}>{plan.recommendedRange[0]}–{plan.recommendedRange[1]} m³/s</span>}/>
          </div>

          <button onClick={()=>setSubmitted(true)} style={{ width:'100%',marginTop:12,padding:'10px',borderRadius:8,border:'none',background:'#2563eb',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer' }}>
            Compute Ensemble Impact →
          </button>
        </Panel>

        {/* Ensemble output */}
        <Panel title="Ensemble Downstream Impact (20 members)">
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12 }}>
            {[['P10 (best case)',plan.p10,'#16a34a'],['P50 (median)',plan.p50,'#7c3aed'],['P90 (worst case)',plan.p90,'#dc2626']].map(([l,v,c])=>(
              <div key={l} style={{ textAlign:'center',background:'#f8fafc',borderRadius:8,padding:'10px 6px' }}>
                <div style={{ fontSize:10,color:'#94a3b8',marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:20,fontWeight:900,color:c }}>{fmt(v)}m</div>
                <div style={{ fontSize:10,color:'#64748b' }}>downstream peak</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
              <span style={{ fontSize:11.5,fontWeight:700,color:'#1e293b' }}>Major flood exceedance</span>
              <span style={{ fontSize:14,fontWeight:800,color:excColor }}>{Math.round(plan.excMajor*100)}%</span>
            </div>
            <div style={{ height:10,background:'#f1f5f9',borderRadius:5,overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${plan.excMajor*100}%`,background:excColor,borderRadius:5 }}/>
            </div>
            <div style={{ fontSize:11,color:'#64748b',marginTop:4 }}>
              Confidence: <strong style={{ color: plan.confidence==='High'?'#16a34a':plan.confidence==='Moderate'?'#d97706':'#dc2626' }}>{plan.confidence}</strong> · Spread: {fmt(plan.p90-plan.p10)}m
            </div>
          </div>

          <div style={{ fontSize:11,fontWeight:700,color:'#64748b',marginBottom:6 }}>Release timing comparison</div>
          {plan.timeOptions.map((opt)=>(
            <div key={opt.label} style={{ display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 10px',background:'#f8fafc',borderRadius:7,marginBottom:5 }}>
              <span style={{ fontSize:11.5,fontWeight:600,color:'#374151' }}>{opt.label}</span>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12,fontWeight:700,color: opt.peakP50>4.7?'#dc2626':opt.peakP50>3.8?'#d97706':'#16a34a' }}>{fmt(opt.peakP50)}m downstream P50</div>
                <div style={{ fontSize:10,color:'#94a3b8' }}>Exc. major: {Math.round(opt.exceedsMajor*100)}%</div>
              </div>
            </div>
          ))}

          {!plan.safeToRelease && (
            <div style={{ marginTop:8,padding:'10px 12px',background:'#fee2e2',borderRadius:8,fontSize:11.5,color:'#dc2626',fontWeight:700 }}>
              ⚠ Proposed release exceeds safe limit or creates {Math.round(plan.excMajor*100)}% major flood probability. Reduce release rate or delay operation.
            </div>
          )}

          {plan.safeToRelease && (
            <div style={{ marginTop:8,padding:'10px 12px',background:'#dcfce7',borderRadius:8,fontSize:11.5,color:'#15803d',fontWeight:700 }}>
              ✓ Proposed release is within safe limits. Downstream impact manageable.
            </div>
          )}

          {/* Approval workflow */}
          <div style={{ marginTop:12,borderTop:'1px solid #f1f5f9',paddingTop:12 }}>
            <div style={{ fontSize:11,fontWeight:700,color:'#64748b',marginBottom:6 }}>Approval Workflow</div>
            <textarea value={approvalNote} onChange={(e)=>setApprovalNote(e.target.value)} placeholder="Enter release justification for authorisation record…" rows={2} style={{ width:'100%',fontSize:11,padding:'7px 9px',border:'1px solid #e2e8f0',borderRadius:7,resize:'vertical',boxSizing:'border-box' }}/>
            {!approved
              ? <button onClick={()=>setApproved(true)} disabled={!approvalNote} style={{ marginTop:6,width:'100%',padding:'8px',borderRadius:7,border:'none',background:approvalNote?'#16a34a':'#e2e8f0',color:approvalNote?'#fff':'#94a3b8',fontSize:12,fontWeight:700,cursor:approvalNote?'pointer':'default' }}>Submit for Authorisation</button>
              : <div style={{ marginTop:6,padding:'8px 12px',background:'#dcfce7',borderRadius:7,fontSize:12,fontWeight:700,color:'#15803d' }}>✓ Release plan submitted — awaiting Senior Engineer approval</div>
            }
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ── Tab 4: Irrigation Planning ────────────────────────────────────
function IrrigationPlanning({ selectedId }) {
  const r = RESERVOIRS.find((x)=>x.id===selectedId)
  const plans = IRRIGATION_PLANS[selectedId] || []
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
      <div style={{ padding:'10px 14px',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:9,fontSize:12,color:'#1d4ed8',fontWeight:600 }}>
        📡 Seasonal outlook: {SEASONAL_FORECAST_NOTE}
      </div>
      {plans.length === 0 ? (
        <Panel title="Irrigation Plans"><div style={{ fontSize:11.5,color:'#94a3b8',fontStyle:'italic' }}>No irrigation plans configured for this reservoir. Add via field officer portal.</div></Panel>
      ) : plans.map((plan,i)=>(
        <Panel key={i} title={`${plan.commandArea} — ${plan.cropType}`}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:12 }}>
            <InfoCard label="Cultivated area" v={`${plan.areaCultivated.toLocaleString()} ha`}/>
            <InfoCard label="Crop stage" v={plan.cropStage}/>
            <InfoCard label="Water required" v={`${plan.waterRequired} Mm³`}/>
            <InfoCard label="Schedule" v={plan.scheduled}/>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
            <span style={{ fontSize:11.5,fontWeight:700,color:'#64748b' }}>Water issue — planned vs actual</span>
            {plan.deficit>0 && <span style={{ fontSize:11,fontWeight:700,color:'#dc2626' }}>Deficit: {plan.deficit} Mm³</span>}
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
            <div>
              <div style={{ fontSize:10,color:'#94a3b8',marginBottom:3 }}>Planned ({plan.planned} Mm³)</div>
              <div style={{ height:12,background:'#f1f5f9',borderRadius:6 }}><div style={{ height:'100%',width:`${Math.min(100,(plan.planned/plan.waterRequired)*100)}%`,background:'#93c5fd',borderRadius:6 }}/></div>
            </div>
            <div>
              <div style={{ fontSize:10,color:'#94a3b8',marginBottom:3 }}>Actual issued ({plan.actual} Mm³)</div>
              <div style={{ height:12,background:'#f1f5f9',borderRadius:6 }}><div style={{ height:'100%',width:`${Math.min(100,(plan.actual/plan.waterRequired)*100)}%`,background: plan.actual<plan.planned?'#f97316':'#22c55e',borderRadius:6 }}/></div>
            </div>
          </div>
          {plan.deficit>0 && (
            <div style={{ marginTop:10,padding:'8px 12px',background:'#fff7ed',borderRadius:7,fontSize:11.5,color:'#92400e' }}>
              Storage shortfall: at current consumption, {r?.name} will not sustain full season allocation. Options: (1) Reduce allocation by 15%, (2) Supplement from groundwater, (3) Curtail secondary crops.
            </div>
          )}
        </Panel>
      ))}
    </div>
  )
}

// ── Root page ─────────────────────────────────────────────────────
export default function M1ReservoirPage() {
  const [tab, setTab] = useState(0)
  const [selectedId, setSelectedId] = useState('R02')
  return (
    <div style={{ background:'#f0f4f8',minHeight:'100%',fontFamily:'inherit' }}>
      {/* Reservoir quick-select */}
      <div style={{ background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'10px 24px',display:'flex',gap:8,alignItems:'center' }}>
        <span style={{ fontSize:11,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.04em' }}>Reservoir</span>
        {RESERVOIRS.map((r)=>(
          <button key={r.id} onClick={()=>setSelectedId(r.id)} style={{ fontSize:12,fontWeight:700,padding:'5px 13px',borderRadius:7,border:r.id===selectedId?'1px solid #2563eb':'1px solid #e2e8f0',background:r.id===selectedId?'#eff6ff':'#fff',color:r.id===selectedId?'#2563eb':'#64748b',cursor:'pointer' }}>
            {r.name} <span style={{ fontSize:10,color: pctColor(r.pct) }}>({r.pct}%)</span>
          </button>
        ))}
      </div>
      {/* Tab bar */}
      <div style={{ background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',display:'flex',gap:2 }}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{ padding:'13px 18px',fontSize:13,fontWeight:tab===i?700:500,color:tab===i?'#2563eb':'#64748b',background:'transparent',border:'none',borderBottom:tab===i?'2px solid #2563eb':'2px solid transparent',cursor:'pointer',whiteSpace:'nowrap' }}>{t}</button>
        ))}
      </div>
      <div style={{ padding:16 }}>
        {tab===0 && <LiveStorage selectedId={selectedId} setSelectedId={setSelectedId}/>}
        {tab===1 && <FloodHistoryRisk selectedId={selectedId}/>}
        {tab===2 && <ReleaseDecision selectedId={selectedId}/>}
        {tab===3 && <IrrigationPlanning selectedId={selectedId}/>}
      </div>
    </div>
  )
}

// ── Tiny helpers ──────────────────────────────────────────────────
const th = { padding:'7px 10px',textAlign:'left',fontSize:11,fontWeight:600,color:'#94a3b8',borderBottom:'1px solid #f1f5f9' }
const td = { padding:'7px 10px',fontSize:11,borderBottom:'1px solid #f8fafc',color:'#374151' }
function InfoCard({label,v}) {
  return <div style={{ textAlign:'center',background:'#f8fafc',borderRadius:8,padding:'8px 6px' }}><div style={{ fontSize:9.5,color:'#94a3b8',marginBottom:2 }}>{label}</div><div style={{ fontSize:12.5,fontWeight:700,color:'#1e293b' }}>{v}</div></div>
}
import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import './styles.css'

const uid = () => Math.random().toString(36).slice(2, 10)
const today = new Date().toISOString().slice(0, 10)

const initialCar = {
  id: 'car-demo', brand: 'Jaecoo', model: 'J6', year: 2026,
  engine: '1.5 Turbo · бензин', transmission: '6DCT', drive: 'передний',
  vin: 'XXXXXXXXXXXXXXXXX', mileage: 2400, fuelAvg: 8.7
}

const initialExpenses = [
  { id: uid(), type: 'fuel', title: 'Газпромнефть АИ-95 Drive', amount: 2850, date: '2026-10-05', km: 2360, liters: 40, note: 'Заправка' },
  { id: uid(), type: 'maintenance', title: 'ТО-0: масло и обслуживание', amount: 12600, date: '2026-09-26', km: 2280, note: 'Первое обслуживание' },
  { id: uid(), type: 'fuel', title: 'АИ-95', amount: 2600, date: '2026-09-24', km: 2190, liters: 37, note: 'Заправка' },
  { id: uid(), type: 'other', title: 'Шиномонтаж', amount: 3200, date: '2026-09-18', km: 1800, note: 'Сезонная замена' }
]

const initialComponents = [
  { id: 'oil', name: 'Моторное масло', kind: 'timeKm', lifeKm: 10000, lifeDays: 365, changedKm: 2280, changedDate: '2026-09-26', icon: '◉' },
  { id: 'air', name: 'Воздушный фильтр', kind: 'km', lifeKm: 15000, changedKm: 2280, icon: '▣' },
  { id: 'cabin', name: 'Салонный фильтр', kind: 'km', lifeKm: 15000, changedKm: 2280, icon: '▤' },
  { id: 'brake', name: 'Тормозные колодки', kind: 'km', lifeKm: 35000, changedKm: 0, icon: '◈' },
  { id: 'spark', name: 'Свечи зажигания', kind: 'km', lifeKm: 30000, changedKm: 0, icon: '✦' },
  { id: 'coolant', name: 'Охлаждающая жидкость', kind: 'timeKm', lifeKm: 60000, lifeDays: 1095, changedKm: 0, changedDate: '2026-01-01', icon: '◇' }
]

const useGarage = create(persist((set, get) => ({
  car: initialCar,
  expenses: initialExpenses,
  components: initialComponents,
  addExpense: (expense) => set(s => ({ expenses: [{ id: uid(), ...expense }, ...s.expenses], car: { ...s.car, mileage: Math.max(s.car.mileage, Number(expense.km || 0)) } })),
  removeExpense: (id) => set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })),
  updateMileage: (mileage) => set(s => ({ car: { ...s.car, mileage: Number(mileage) || s.car.mileage } })),
  replaceComponent: (id) => set(s => ({ components: s.components.map(c => c.id === id ? { ...c, changedKm: s.car.mileage, changedDate: today } : c) }))
}), { name: 'garage-v2' }))

const money = n => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽'
const dateRu = d => new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day:'2-digit', month:'2-digit', year:'numeric' })
const typeName = { fuel:'Топливо', maintenance:'Обслуживание', repair:'Ремонт', parts:'Запчасти', insurance:'Страхование', parking:'Парковка', other:'Другое' }

function health(component, mileage) {
  const kmLife = component.lifeKm || Infinity
  const usedKm = Math.max(0, mileage - (component.changedKm || 0))
  let scoreKm = Math.max(0, Math.min(100, 100 - usedKm / kmLife * 100))
  let score = scoreKm
  if (component.kind === 'timeKm' && component.changedDate) {
    const days = Math.max(0, Math.floor((Date.now() - new Date(component.changedDate).getTime()) / 86400000))
    const scoreDays = Math.max(0, Math.min(100, 100 - days / component.lifeDays * 100))
    score = Math.min(scoreKm, scoreDays)
  }
  return { score: Math.round(score), usedKm, leftKm: Math.max(0, Math.round(kmLife - usedKm)) }
}

function App(){
  const [tab,setTab] = useState('home')
  const [theme,setTheme] = useState(() => localStorage.getItem('garage.theme') || 'light')
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('garage.theme', theme) }, [theme])
  const [showAdd,setShowAdd] = useState(false)
  const {car, expenses, components} = useGarage()
  const total = expenses.reduce((s,e)=>s+Number(e.amount||0),0)
  const month = expenses.filter(e=>e.date.slice(0,7)===today.slice(0,7)).reduce((s,e)=>s+Number(e.amount||0),0)
  const healths = components.map(c=>({...c,...health(c,car.mileage)}))
  const attention = healths.filter(c=>c.score<35)
  const avgHealth = Math.round(healths.reduce((s,c)=>s+c.score,0)/healths.length)

  return <div className="app">
    <header className="topbar"><div className="brand"><span className="brandMark">G</span><div><b>GARAGE</b><small>цифровая история автомобиля</small></div></div><div className="headerActions"><div className="carMini"><span>{car.brand} {car.model}</span><em>{car.mileage.toLocaleString('ru-RU')} км</em></div><button className="themeToggle" onClick={()=>setTheme(theme==='light'?'dark':'light')} aria-label="Переключить тему">{theme==='light'?'☾':'☀'}</button></div></header>
    <main className="content">
      {tab==='home' && <Home car={car} avgHealth={avgHealth} attention={attention} month={month} total={total} onAdd={()=>setShowAdd(true)} onTab={setTab} healths={healths}/>} 
      {tab==='expenses' && <Expenses expenses={expenses} onAdd={()=>setShowAdd(true)} onRemove={useGarage.getState().removeExpense}/>} 
      {tab==='health' && <Health healths={healths} onReplace={useGarage.getState().replaceComponent}/>} 
      {tab==='car' && <Car car={car}/>} 
      {tab==='profile' && <Profile car={car}/>} 
    </main>
    <nav className="bottomnav">{[['home','⌂','Главная'],['expenses','₽','Расходы'],['health','◔','Ресурс'],['car','▱','Авто'],['profile','○','Профиль']].map(([id,icon,label])=><button className={tab===id?'active':''} onClick={()=>setTab(id)} key={id}><span>{icon}</span>{label}</button>)}</nav>
    {showAdd && <AddExpense onClose={()=>setShowAdd(false)}/>} 
  </div>
}

function Home({car,avgHealth,attention,month,total,onAdd,onTab,healths}){
 return <div className="stack">
   <section className="hero card"><div className="heroCopy"><span className="eyebrow">МОЯ МАШИНА</span><h1>{car.brand} {car.model}</h1><p>{car.year} · {car.engine} · {car.transmission}</p><button className="primary" onClick={()=>onTab('car')}>Открыть гараж →</button></div><div className="healthRing" style={{'--p':avgHealth*3.6+'deg'}}><div><strong>{avgHealth}%</strong><span>ресурс</span></div></div></section>
   <div className="grid2"><section className="card stat"><span>Расходы в этом месяце</span><strong>{money(month)}</strong><small>Всего в истории: {money(total)}</small></section><section className="card stat"><span>Средний расход</span><strong>{car.fuelAvg} л/100 км</strong><small>расчёт по заправкам</small></section></div>
   <section className="card"><div className="sectionHead"><div><span className="eyebrow">СОСТОЯНИЕ</span><h2>Что требует внимания</h2></div><button className="link" onClick={()=>onTab('health')}>Все компоненты</button></div>{attention.length===0 ? <div className="emptyGood">✓ Сейчас ничего критичного — машина под присмотром.</div> : attention.map(c=><HealthRow key={c.id} c={c}/>)}</section>
   <section className="card"><div className="sectionHead"><div><span className="eyebrow">БЫСТРОЕ ДЕЙСТВИЕ</span><h2>Добавить событие</h2></div></div><div className="quick"><button onClick={onAdd}>＋ Расход</button><button onClick={()=>onTab('health')}>◔ Проверить ресурс</button><button onClick={()=>onTab('car')}>▱ Пробег</button></div></section>
   <section className="card"><div className="sectionHead"><div><span className="eyebrow">РЕСУРС</span><h2>Главные узлы</h2></div><button className="link" onClick={()=>onTab('health')}>Подробнее</button></div><div className="healthList">{healths.slice(0,4).map(c=><HealthRow key={c.id} c={c}/>)}</div></section>
 </div>
}

function HealthRow({c}){ const cls=c.score<35?'bad':c.score<65?'warn':'good'; return <div className="healthRow"><span className={'healthIcon '+cls}>{c.icon}</span><div className="healthInfo"><b>{c.name}</b><small>{c.leftKm.toLocaleString('ru-RU')} км до ориентировочной замены</small><div className="bar"><i className={cls} style={{width:c.score+'%'}}/></div></div><strong className={cls}>{c.score}%</strong></div> }

function Expenses({expenses,onAdd,onRemove}){ const [filter,setFilter]=useState('all'); const list=filter==='all'?expenses:expenses.filter(e=>e.type===filter); const sum=list.reduce((s,e)=>s+Number(e.amount),0); return <div className="stack"><div className="pageTitle"><div><span className="eyebrow">ИСТОРИЯ</span><h1>Расходы</h1><p>Каждая трата становится частью истории автомобиля.</p></div><button className="primary" onClick={onAdd}>＋ Добавить</button></div><div className="chips">{[['all','Все'],['fuel','Топливо'],['maintenance','ТО'],['repair','Ремонт'],['parts','Запчасти'],['other','Другое']].map(x=><button className={filter===x[0]?'chip active':'chip'} onClick={()=>setFilter(x[0])} key={x[0]}>{x[1]}</button>)}</div><section className="card expenseSummary"><div><span>Показано</span><b>{list.length} событий</b></div><div><span>Сумма</span><b>{money(sum)}</b></div></section><section className="card expenseList">{list.map(e=><div className="expense" key={e.id}><div className={'expenseIcon '+e.type}>{e.type==='fuel'?'₽':e.type==='maintenance'?'⚙':e.type==='repair'?'⚒':'•'}</div><div className="expenseMain"><b>{e.title}</b><small>{dateRu(e.date)} · {e.km?.toLocaleString('ru-RU')} км {e.liters?`· ${e.liters} л`:''}</small></div><strong>{money(e.amount)}</strong><button className="delete" onClick={()=>onRemove(e.id)}>×</button></div>)}{!list.length&&<div className="empty">Нет событий в этой категории.</div>}</section></div> }

function Health({healths,onReplace}){ return <div className="stack"><div className="pageTitle"><div><span className="eyebrow">МОДЕЛЬ РЕСУРСА</span><h1>Здоровье авто</h1><p>Это не диагностика. Это расчётный ресурс по пробегу и времени, основанный на типовом сроке службы.</p></div></div><section className="card formula"><b>Как считается</b><span>100% после замены → ресурс постепенно уменьшается каждый км/день → новая замена возвращает компонент к 100%.</span></section><div className="healthGrid">{healths.map(c=><article className="card component" key={c.id}><div className="componentTop"><span className={'bigIcon '+(c.score<35?'bad':'')}>{c.icon}</span><span className={'score '+(c.score<35?'bad':c.score<65?'warn':'good')}>{c.score}%</span></div><h3>{c.name}</h3><div className="bar large"><i className={c.score<35?'bad':c.score<65?'warn':'good'} style={{width:c.score+'%'}}/></div><p>{c.leftKm.toLocaleString('ru-RU')} км ориентировочно до замены</p><small>Последняя замена: {c.changedKm ? `${c.changedKm.toLocaleString('ru-RU')} км` : 'нет данных'}</small><button className="secondary" onClick={()=>onReplace(c.id)}>Отметить замену сейчас</button></article>)}</div></div> }

function Car({car}){ const [km,setKm]=useState(car.mileage); return <div className="stack"><div className="pageTitle"><div><span className="eyebrow">ГАРАЖ</span><h1>{car.brand} {car.model}</h1><p>Профиль автомобиля и базовые данные.</p></div></div><section className="card carProfile"><div className="carVisual">G</div><div className="specs"><Spec n="Год" v={car.year}/><Spec n="Двигатель" v={car.engine}/><Spec n="Коробка" v={car.transmission}/><Spec n="Привод" v={car.drive}/><Spec n="VIN" v={car.vin}/></div></section><section className="card mileage"><div><span className="eyebrow">ПРОБЕГ</span><h2>{car.mileage.toLocaleString('ru-RU')} км</h2><p>Пробег — главный вход для расчёта ресурса.</p></div><div className="kmEdit"><input type="number" value={km} onChange={e=>setKm(e.target.value)}/><button className="primary" onClick={()=>useGarage.getState().updateMileage(km)}>Сохранить</button></div></section></div> }
function Spec({n,v}){return <div><span>{n}</span><b>{v}</b></div>}
function Profile({car}){return <div className="stack"><div className="pageTitle"><div><span className="eyebrow">АККАУНТ</span><h1>Профиль</h1><p>Настройки и данные GARAGE.</p></div></div><section className="card profile"><div className="avatar">G</div><div><h2>Автовладелец</h2><p>Локальный демо-профиль</p></div></section><section className="card roadmap"><span className="eyebrow">ДАЛЬШЕ</span><h2>GARAGE будет расти вокруг истории машины</h2><div className="road"><span>Расходы</span><span>Ресурс</span><span>Заправки</span><span>Запчасти</span><span>Документы</span><span>Карта</span></div><p>Следующие модули можно подключать к той же модели событий, не разрывая историю автомобиля.</p></section></div>}

function AddExpense({onClose}){ const add=useGarage(s=>s.addExpense); const [form,setForm]=useState({type:'fuel',title:'',amount:'',date:today,km:useGarage.getState().car.mileage,liters:'',note:''}); const set=(k,v)=>setForm(f=>({...f,[k]:v})); const submit=e=>{e.preventDefault();if(!form.title||!form.amount)return;add({...form,amount:Number(form.amount),km:Number(form.km),liters:form.liters?Number(form.liters):undefined});onClose()};return <div className="overlay"><form className="modal" onSubmit={submit}><div className="modalHead"><div><span className="eyebrow">НОВОЕ СОБЫТИЕ</span><h2>Добавить расход</h2></div><button type="button" className="close" onClick={onClose}>×</button></div><label>Тип<select value={form.type} onChange={e=>set('type',e.target.value)}><option value="fuel">Топливо</option><option value="maintenance">Обслуживание / ТО</option><option value="repair">Ремонт</option><option value="parts">Запчасти</option><option value="insurance">Страхование</option><option value="parking">Парковка</option><option value="other">Другое</option></select></label><label>Название<input autoFocus value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Например: замена масла"/></label><div className="formGrid"><label>Сумма, ₽<input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="0"/></label><label>Пробег, км<input type="number" value={form.km} onChange={e=>set('km',e.target.value)}/></label></div><div className="formGrid"><label>Дата<input type="date" value={form.date} onChange={e=>set('date',e.target.value)}/></label>{form.type==='fuel'?<label>Литры<input type="number" step="0.1" value={form.liters} onChange={e=>set('liters',e.target.value)}/></label>:<label>Место / заметка<input value={form.note} onChange={e=>set('note',e.target.value)} placeholder="СТО, заправка..."/></label>}</div><div className="modalActions"><button type="button" className="secondary" onClick={onClose}>Отмена</button><button className="primary">Сохранить событие</button></div></form></div>}

createRoot(document.getElementById('root')).render(<App />)

import { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useData } from '../contexts/DataContext'
import { useLang } from '../contexts/LanguageContext'
import Card from '../components/Card'
import Button from '../components/Button'
import CustomSelect from '../components/CustomSelect'

const ICONS = [
  // Education & School
  'graduation-cap','book','book-open','book-reader','chalkboard','chalkboard-teacher','school','university','pencil','pen',
  'pen-fancy','pen-nib','pen-clip','highlighter','eraser','ruler','ruler-combined','ruler-horizontal','ruler-vertical',
  'backpack','apple-whole','glasses','user-graduate','award','certificate','stamp','ribbon','medal','trophy',
  'ranking-star','clipboard','clipboard-list','clipboard-check','note-sticky','file','file-lines','file-pen','file-export',
  'file-import','file-zipper','file-circle-check','file-signature',
  // Math & Numbers
  'calculator','square-root-variable','infinity','superscript','subscript','percent','divide','plus','minus','equals',
  'pi','wave-square','chart-bar','chart-line','chart-pie','chart-area','chart-column','chart-gantt','chart-simple',
  'sort-numeric-down','sort-numeric-up','greater-than','less-than','greater-than-equal','less-than-equal','not-equal',
  'angle-left','angle-right','shapes','draw-polygon','vector-square','bezier-curve','circle','square','triangle-exclamation',
  // Science & Lab
  'atom','flask','flask-vial','vial','vials','vial-virus','dna','microscope','magnet','radiation','biohazard',
  'temperature-half','temperature-high','temperature-low','fire','fire-flame-curved','fire-flame-simple','droplet',
  'eye-dropper','syringe','bacteria','virus','disease','prescription-bottle','mortar-pestle','bong','filter',
  'filter-circle-xmark','diagram-project','diagram-next',
  // Space & Astronomy
  'sun','moon','star','meteor','rocket','shuttle-space','satellite','satellite-dish','earth-americas','earth-asia',
  'earth-europe','earth-africa','earth-oceania','globe','user-astronaut','explosion','burst','comet',
  // Technology & Devices
  'laptop','laptop-code','laptop-file','laptop-medical','computer','desktop','display','keyboard','mouse',
  'microchip','memory','hard-drive','server','database','wifi','bluetooth','usb','ethernet','network-wired',
  'mobile','mobile-screen','tablet','tablet-screen-button','tv','camera','camera-retro','video','microphone',
  'headphones','headset','print','fax','pager','sim-card','sd-card','compact-disc','floppy-disk',
  'plug','battery-full','battery-half','battery-quarter','solar-panel','tower-broadcast','tower-cell','signal',
  // Programming & CS
  'code','file-code','terminal','bug','bug-slash','code-branch','code-commit','code-compare','code-fork',
  'code-merge','code-pull-request','sitemap','project-diagram','cubes','cube','layer-group','object-group','object-ungroup',
  'puzzle-piece','shield-halved','lock','unlock','key','qrcode','barcode','hashtag','at','link','link-slash',
  // AI & Data Science
  'robot','brain','lightbulb','wand-magic-sparkles','circle-nodes',
  'magnifying-glass-chart','bars-progress','table','table-cells','table-columns','table-list',
  // Languages & Communication
  'language','spell-check','font','text-height','text-width','paragraph','align-left','align-center','align-right',
  'align-justify','list','list-ol','list-ul','list-check','quote-left','quote-right','comment','comments','message',
  'envelope','envelope-open','paper-plane','inbox','flag','flag-checkered','flag-usa','bullhorn','megaphone',
  // Literature & Writing
  'book-bookmark','book-journal-whills','book-skull','book-tanakh','book-atlas','book-bible','book-medical',
  'book-quran','scroll','scroll-torah','newspaper','feather','feather-pointed','pen-to-square','signature',
  'italic','bold','underline','strikethrough','indent','outdent','section','ellipsis',
  // Religion & Philosophy
  'hands-praying','pray','church','mosque','kaaba','cross','star-and-crescent','star-of-david','menorah',
  'om','yin-yang','dharmachakra','peace','place-of-worship','torii-gate','gopuram','vihara','hamsa','khanda',
  'dove','hand-holding-heart','heart','heart-pulse','ankh','bahai',
  // History & Archaeology
  'landmark','landmark-dome','landmark-flag','monument','archway','building-columns','scale-balanced','gavel',
  'chess-rook','chess-king','chess-queen','chess-knight','chess-bishop','chess-pawn','chess-board',
  'chess','castle','crown','dungeon','shield','skull-crossbones','person-digging','bone','skull',
  // Geography & Environment
  'map','map-location-dot','map-location','map-pin','location-dot','location-crosshairs','compass',
  'mountain','mountain-sun','mountain-city','tree','tree-city','seedling','leaf','clover','water','water-ladder',
  'volcano','hurricane','tornado','wind','cloud','cloud-sun','cloud-rain','cloud-bolt','cloud-showers-heavy',
  'snowflake','icicles','temperature-arrow-up','temperature-arrow-down',
  'city','building','buildings','house','igloo','tent','campground','road','bridge','bridge-water',
  // Economics & Business
  'coins','money-bill','money-bill-wave','money-bill-trend-up','money-bill-transfer','money-bill-1-wave','money-check',
  'money-check-dollar','credit-card','wallet','piggy-bank','dollar-sign','euro-sign','yen-sign','rupiah-sign',
  'bitcoin-sign','sack-dollar','sack-xmark','vault','briefcase',
  'receipt','cash-register','store','shop','cart-shopping','basket-shopping','bag-shopping','tags','tag',
  'file-invoice','file-invoice-dollar','arrow-trend-up','arrow-trend-down',
  // Civics & Law
  'building-flag','people-group','people-roof','people-pulling','people-arrows',
  'person-booth','box-ballot','id-card','id-badge','passport',
  // Arts & Design
  'palette','paint-brush','paintbrush','brush','pen-ruler','paint-roller','spray-can','spray-can-sparkles','swatchbook',
  'icons','wand-magic','wand-sparkles','drafting-compass','compass-drafting','eye','eye-slash',
  'image','images','panorama','crop','crop-simple','scissors','cut','copy','paste','clone','fill-drip','fill',
  // Music
  'music','guitar','drum','drum-steelpan','headphones-simple','radio','record-vinyl',
  'volume-high','volume-low','volume-off','volume-xmark','sliders','microphone-lines','microphone-slash','itunes-note',
  // Film & Theater
  'masks-theater','theater-masks','film','clapperboard','ticket','ticket-simple','photo-film',
  'camera-movie','popcorn',
  // Sports & PE
  'person-running','person-walking','person-swimming','person-biking','person-skiing','person-skating',
  'person-snowboarding','person-hiking','person-praying','basketball','football','volleyball','baseball-bat-ball',
  'baseball','golf-ball-tee','table-tennis-paddle-ball','bowling-ball','futbol','hockey-puck','lacrosse',
  'dumbbell','weight-hanging','weight-scale','stopwatch','stopwatch-20',
  'bullseye','crosshairs','bicycle','swimmer',
  // Medical & Health
  'stethoscope','pills','capsules','bandage','hospital','hospital-user','user-doctor','user-nurse',
  'wheelchair','wheelchair-move','crutch','tooth','lungs','lungs-virus','x-ray','joint',
  'hand-holding-medical','notes-medical','prescription','thermometer','kit-medical','heartbeat',
  'bed-pulse','staff-snake',
  // Social Studies & People
  'user','users','user-group','user-tie','user-secret','children','baby','child','person',
  'person-dress','person-cane','person-half-dress','handshake','handshake-angle','handshake-simple',
  'hands-holding','hands-holding-circle','hands-holding-child','people-carry-box','circle-user','address-book',
  'hand','hands','fist-raised','hand-peace',
  // Nature & Biology
  'paw','dog','cat','fish','fish-fins','crow',
  'bugs','spider','locust','mosquito','frog','hippo','otter','horse','horse-head',
  'dragon','kiwi-bird','shrimp','worm','cow','deer','elephant','monkey','snake','turtle',
  'wheat-awn','plant-wilt','flower','flower-daffodil','mushroom',
  // Engineering & Industry
  'gear','gears','cog','cogs','wrench','screwdriver','screwdriver-wrench','hammer','toolbox',
  'tools','bolt','bolt-lightning','industry','building-shield','hard-hat','helmet-safety',
  'ruler-triangle','bridge-suspension','crane','truck','car','bus','train','plane',
  'ship','helicopter','motorcycle','tractor',
  // Environment & Sustainability
  'recycle','smog','dumpster','trash','trash-can','oil-can','gas-pump',
  'faucet','faucet-drip','hand-holding-droplet','bucket',
  // Objects & School Supplies
  'paperclip','thumbtack','folder','folder-open','folder-plus','folder-minus','box','box-open',
  'box-archive','clock','hourglass','hourglass-half','hourglass-start','hourglass-end','calendar','calendar-days',
  'calendar-check','calendar-plus','calendar-minus','calendar-week','calendar-xmark','bell','bell-slash',
  'magnifying-glass','search','magnifying-glass-plus','magnifying-glass-minus',
  'dice','dice-d6','dice-d20','gamepad',
  // Symbols & Misc
  'gem','circle-check','circle-xmark','circle-info','circle-question','circle-exclamation','circle-plus','circle-minus',
  'check','xmark','question','exclamation','thumbs-up','thumbs-down','face-smile','face-laugh',
  'face-grin','face-frown','face-meh','gift','cake-candles','champagne-glasses',
  'ghost','hat-wizard','broom','candy-cane','cookie','mug-hot','coffee','utensils',
]




const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// Professional clean input styles with highly rounded corners & pure black dark mode
const inputCls = 'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] text-gray-800 dark:text-gray-100 text-sm shadow-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 mb-2 ml-1">
      {children}{required && <span className="text-primary ml-1">*</span>}
    </label>
  )
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]"></div>
      {label && <span className="text-[10px] font-medium text-gray-400 dark:text-white/30 uppercase tracking-widest">{label}</span>}
      <div className="h-px flex-1 bg-gray-200 dark:bg-white/[0.06]"></div>
    </div>
  )
}

function LinkModal({ isOpen, onClose, onSave, link }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (isOpen) {
      setTitle(link?.title || '')
      setUrl(link?.url || '')
    }
  }, [isOpen, link])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (url) {
      onSave({ title: title || url, url })
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
      <div className="relative bg-white dark:bg-surface-1 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col border border-gray-200 dark:border-white/[0.08] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.06]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">{link ? 'Edit Link' : 'Add Link'}</h3>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-surface-2 cursor-pointer transition-colors">
            <i className="fas fa-times text-xs"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <FieldLabel>Title</FieldLabel>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Title" className={inputCls} />
          </div>
          <div>
            <FieldLabel required>URL</FieldLabel>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} required
              placeholder="https://..." className={inputCls} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white/50 text-xs font-medium hover:bg-gray-50 dark:hover:bg-surface-2 cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded-lg bg-primary text-white text-xs font-medium shadow-sm hover:bg-primary-dark cursor-pointer transition-colors">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    if (!search) return ICONS
    const q = search.toLowerCase()
    return ICONS.filter(ic => ic.includes(q))
  }, [search])

  return (
    <>
      {/* Inline trigger — shows selected icon */}
      <button type="button" onClick={() => { setOpen(true); setSearch('') }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] hover:border-primary/50 cursor-pointer transition-all w-full shadow-sm group">
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
          <i className={`fas fa-${value}`}></i>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{value}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Tap to change icon</p>
        </div>
        <i className="fas fa-chevron-right text-xs text-gray-300 dark:text-gray-600"></i>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
          <div className="relative bg-white dark:bg-surface-1 rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col border border-gray-200 dark:border-white/[0.08] overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.06]">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white/90">Choose Icon</h3>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-surface-2 cursor-pointer transition-colors">
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
            {/* Search */}
            <div className="px-4 py-2.5 border-b border-gray-200 dark:border-white/[0.06]">
              <div className="relative">
                <i className="fas fa-search absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-white/30"></i>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} autoFocus
                  placeholder="Search..." className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-surface-2 text-gray-800 dark:text-white/90 text-xs placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors" />
              </div>
            </div>
            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-none">
              <div className="grid grid-cols-8 gap-1.5">
                {filtered.map(ic => (
                  <button type="button" key={ic} onClick={() => { onChange(ic); setOpen(false) }}
                    className={`w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-all cursor-pointer ${
                      value === ic
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-surface-2 hover:text-gray-600 dark:hover:text-white/60'
                    }`}>
                    <i className={`fas fa-${ic}`}></i>
                  </button>
                ))}
              </div>
              {filtered.length === 0 && <p className="text-center text-xs text-gray-400 dark:text-white/30 py-6">No icons found</p>}
            </div>
            {/* Footer count */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-white/[0.06] text-center">
              <span className="text-[10px] text-gray-400 dark:text-white/30">{filtered.length} icons</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Removed DayToggle component as it is replaced by dropdowns

// ==========================================
// ADD CLASS PAGE
// ==========================================
export function AddClassPage() {
  const navigate = useNavigate()
  const { addClass } = useData()
  const { t } = useLang()

  const [name, setName] = useState('')
  const [teacher, setTeacher] = useState('')
  const [room, setRoom] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('graduation-cap')
  
  const [schedules, setSchedules] = useState([{ day: 'monday', startTime: '', endTime: '' }])

  const addSchedule = () => setSchedules([...schedules, { day: 'monday', startTime: '', endTime: '' }])
  const updateSchedule = (index, field, value) => {
    const newSchedules = [...schedules]
    newSchedules[index][field] = value
    setSchedules(newSchedules)
  }
  const removeSchedule = (index) => setSchedules(schedules.filter((_, i) => i !== index))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const validSchedules = schedules.filter(s => s.day).map(s => {
      const formattedTime = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || '')
      return { day: s.day.toLowerCase(), time: formattedTime, startTime: s.startTime, endTime: s.endTime }
    })
    if (validSchedules.length === 0) validSchedules.push({ day: 'monday', time: '', startTime: '', endTime: '' })

    const daysList = [...new Set(validSchedules.map(s => s.day))]
    const scheduleString = validSchedules.map(s => `${s.day.substring(0,3)} ${s.time}`.trim()).join(', ')
    const firstTime = validSchedules[0]?.time || ''

    addClass({
      name: name.trim(),
      teacher: teacher.trim(),
      room: room.trim(),
      description: description.trim(),
      icon,
      schedule: scheduleString,
      days: daysList, 
      time: firstTime, 
      schedules: validSchedules, 
      links: [],
    })
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-4 overflow-auto h-full max-h-[600px] pb-4 bg-[#f8f9fa] dark:bg-black scrollbar-none">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left text-primary"></i>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">Add New Class</h1>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        <div>
          <FieldLabel required>{t("className")?.toUpperCase() || "CLASS NAME"}</FieldLabel>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            placeholder={t("classNamePlaceholder") || "e.g. Advanced Mathematics"} className={`${inputCls} py-3 text-base`} autoFocus/>
        </div>

        <div>
           <FieldLabel>{t("teacherName")?.toUpperCase() || "TEACHER"}</FieldLabel>
           <input type="text" value={teacher} onChange={e => setTeacher(e.target.value)}
             placeholder={t("teacherPlaceholder") || "e.g. Dr. Sarah Jenkins"} className={`${inputCls} py-3 text-base`} />
        </div>

        <div>
          <FieldLabel>{t("roomLabel")?.toUpperCase() || "ROOM"}</FieldLabel>
          <input type="text" value={room} onChange={e => setRoom(e.target.value)}
            placeholder={t("roomPlaceholder") || "302 B"} className={`${inputCls} py-3 text-base`} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 mt-4">
            <FieldLabel>{t("classSchedule")?.toUpperCase() || "CLASS SCHEDULE"}</FieldLabel>
            <button type="button" onClick={addSchedule} className="text-primary text-xs font-bold hover:underline cursor-pointer">
              + Add Schedule
            </button>
          </div>
          <div className="space-y-3">
            {schedules.map((sched, index) => (
              <div key={index} className={`flex flex-col sm:flex-row gap-2 items-start bg-white dark:bg-[#0a0a0a] p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative ${schedules.length > 1 ? 'pr-10' : ''}`}>
                <div className="flex-1 w-full space-y-2">
                  <select value={sched.day} onChange={e => updateSchedule(index, 'day', e.target.value)}
                    className={`${inputCls} !py-2.5 text-sm capitalize`}>
                    {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="time" value={sched.startTime} onChange={e => updateSchedule(index, 'startTime', e.target.value)}
                        className={`${inputCls} !py-2.5 text-sm [color-scheme:light] dark:[color-scheme:dark]`} required />
                    </div>
                    <div className="relative flex-1">
                      <input type="time" value={sched.endTime} onChange={e => updateSchedule(index, 'endTime', e.target.value)}
                        className={`${inputCls} !py-2.5 text-sm [color-scheme:light] dark:[color-scheme:dark]`} required />
                    </div>
                  </div>
                </div>
                {schedules.length > 1 && (
                  <button type="button" onClick={() => removeSchedule(index)}
                    className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>{t("selectClassIcon")?.toUpperCase() || "CLASS ICON"}</FieldLabel>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <div>
          <FieldLabel>{t("courseDescription")?.toUpperCase() || "DESCRIPTION"}</FieldLabel>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder={t("courseDescPlaceholder") || "Enter course overview..."} rows={3}
            className={`${inputCls} py-3 text-base resize-none`}></textarea>
        </div>

        {/* Buttons */}
        <div className="pt-4 flex flex-col gap-3 pb-8">
          <button type="submit" disabled={!name}
            className="w-full py-4 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            <i className="fas fa-check-circle"></i> {t("createClass") || "Create Class"}
          </button>
          <button type="button" onClick={() => navigate('/')}
            className="w-full py-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-center cursor-pointer">
            Discard Changes
          </button>
        </div>
      </form>
    </div>
  )
}

// ==========================================
// EDIT CLASS PAGE
// ==========================================
export function EditClassPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { classes, editClass } = useData()
  const { t } = useLang()
  const cls = classes.find(c => c.id === id)

  const [name, setName] = useState(cls?.name || '')
  const [teacher, setTeacher] = useState(cls?.teacher || '')
  const [room, setRoom] = useState(cls?.room || '')
  const [description, setDescription] = useState(cls?.description || '')
  const [icon, setIcon] = useState(cls?.icon || 'graduation-cap')

  const initSchedules = useMemo(() => {
    if (cls?.schedules?.length > 0) {
      return cls.schedules.map(s => {
        let st = s.startTime || '', et = s.endTime || '';
        if (s.time && !st && !et) {
          const parts = s.time.split(' - ');
          st = parts[0]?.trim() || '';
          et = parts[1]?.trim() || '';
        }
        return { day: s.day.toLowerCase(), startTime: st, endTime: et }
      })
    }
    // Fallback if old data format
    if (cls?.days?.length > 0) {
      let st = '', et = '';
      if (cls.time) {
        const parts = cls.time.split(' - ');
        st = parts[0]?.trim() || '';
        et = parts[1]?.trim() || '';
      }
      return cls.days.map(day => ({ day: day.toLowerCase(), startTime: st, endTime: et }))
    }
    return [{ day: 'monday', startTime: '', endTime: '' }]
  }, [cls]);

  const [schedules, setSchedules] = useState(initSchedules);
  const [links, setLinks] = useState(cls?.links || []);
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const addSchedule = () => setSchedules([...schedules, { day: 'monday', startTime: '', endTime: '' }])
  const updateSchedule = (index, field, value) => {
    const newSchedules = [...schedules]
    newSchedules[index][field] = value
    setSchedules(newSchedules)
  }
  const removeSchedule = (index) => setSchedules(schedules.filter((_, i) => i !== index))

  const addLink = () => {
    if (newLinkUrl) {
      setLinks(prev => [...prev, { url: newLinkUrl }])
      setNewLinkUrl('')
    }
  }

  const removeLink = (index) => setLinks(prev => prev.filter((_, i) => i !== index))

  if (!cls) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-white/40">
        <i className="fas fa-search text-2xl mb-3 text-gray-300 dark:text-white/20"></i>
        <p className="text-sm font-medium">{t('classNotFound')}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-xs text-primary hover:text-primary-dark cursor-pointer transition-colors">{t('goBack')}</button>
      </div>
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const validSchedules = schedules.filter(s => s.day).map(s => {
      const formattedTime = s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : (s.startTime || '')
      return { day: s.day.toLowerCase(), time: formattedTime, startTime: s.startTime, endTime: s.endTime }
    })
    if (validSchedules.length === 0) validSchedules.push({ day: 'monday', time: '', startTime: '', endTime: '' })

    const daysList = [...new Set(validSchedules.map(s => s.day))]
    const scheduleString = validSchedules.map(s => `${s.day.substring(0,3)} ${s.time}`.trim()).join(', ')
    const firstTime = validSchedules[0]?.time || ''

    editClass(id, {
      name: name.trim(), 
      teacher: teacher.trim(),
      room: room.trim(), 
      description: description.trim(),
      icon,
      schedule: scheduleString,
      days: daysList, 
      time: firstTime, 
      schedules: validSchedules, 
      links: links.length > 0 ? links : []
    })
    navigate(`/class/${id}`)
  }

  return (
    <div className="flex flex-col gap-4 overflow-auto h-full max-h-[600px] pb-4 bg-[#f8f9fa] dark:bg-black scrollbar-none">
      <header className="flex justify-between items-center px-4 py-3 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left text-primary"></i>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white/90">Edit Class</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        <div>
          <FieldLabel required>{t("className")?.toUpperCase() || "CLASS NAME"}</FieldLabel>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required
            placeholder={t("classNamePlaceholder") || "e.g. Advanced Mathematics"} className={`${inputCls} py-3 text-base`} />
        </div>

        <div>
           <FieldLabel>{t("teacherName")?.toUpperCase() || "TEACHER"}</FieldLabel>
           <input type="text" value={teacher} onChange={e => setTeacher(e.target.value)}
             placeholder={t("teacherPlaceholder") || "e.g. Dr. Sarah Jenkins"} className={`${inputCls} py-3 text-base`} />
        </div>

        <div>
          <FieldLabel>{t("roomLabel")?.toUpperCase() || "ROOM"}</FieldLabel>
          <input type="text" value={room} onChange={e => setRoom(e.target.value)}
            placeholder={t("roomPlaceholder") || "302 B"} className={`${inputCls} py-3 text-base`} />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2 mt-4">
            <FieldLabel>{t("classSchedule")?.toUpperCase() || "CLASS SCHEDULE"}</FieldLabel>
            <button type="button" onClick={addSchedule} className="text-primary text-xs font-bold hover:underline cursor-pointer">
              + Add Schedule
            </button>
          </div>
          <div className="space-y-3">
            {schedules.map((sched, index) => (
              <div key={index} className={`flex flex-col sm:flex-row gap-2 items-start bg-white dark:bg-[#0a0a0a] p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative ${schedules.length > 1 ? 'pr-10' : ''}`}>
                <div className="flex-1 w-full space-y-2">
                  <select value={sched.day} onChange={e => updateSchedule(index, 'day', e.target.value)}
                    className={`${inputCls} !py-2.5 text-sm capitalize`}>
                    {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="time" value={sched.startTime} onChange={e => updateSchedule(index, 'startTime', e.target.value)}
                        className={`${inputCls} !py-2.5 text-sm [color-scheme:light] dark:[color-scheme:dark]`} required />
                    </div>
                    <div className="relative flex-1">
                      <input type="time" value={sched.endTime} onChange={e => updateSchedule(index, 'endTime', e.target.value)}
                        className={`${inputCls} !py-2.5 text-sm [color-scheme:light] dark:[color-scheme:dark]`} required />
                    </div>
                  </div>
                </div>
                {schedules.length > 1 && (
                  <button type="button" onClick={() => removeSchedule(index)}
                    className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel>{t("selectClassIcon")?.toUpperCase() || "CLASS ICON"}</FieldLabel>
          <IconPicker value={icon} onChange={setIcon} />
        </div>

        <div>
          <FieldLabel>{t("courseDescription")?.toUpperCase() || "DESCRIPTION"}</FieldLabel>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder={t("courseDescPlaceholder") || "Enter course overview..."} rows={3}
            className={`${inputCls} py-3 text-base resize-none`}></textarea>
        </div>

        <div>
          <FieldLabel>{t("classLinks")?.toUpperCase() || "CLASS LINKS"}</FieldLabel>
          {links.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {links.map((link, i) => {
                let hostname = ''
                try { hostname = new URL(link.url).hostname } catch { hostname = link.url }
                return (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800">
                    <i className="fas fa-link text-[10px] text-primary/50"></i>
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">{hostname}</span>
                    <button type="button" onClick={() => removeLink(i)}
                      className="text-gray-400 dark:text-gray-600 hover:text-red-500 text-xs cursor-pointer transition-colors">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          <div className="flex gap-2">
            <input type="url" value={newLinkUrl} onChange={e => setNewLinkUrl(e.target.value)}
              placeholder="https://..." className={`flex-1 ${inputCls} !text-sm !py-2.5 !rounded-xl`} />
            <button type="button" onClick={addLink}
              className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold cursor-pointer hover:bg-primary-dark transition-colors">
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        <div className="pt-4 flex flex-col gap-3 pb-8">
          <button type="submit" disabled={!name}
            className="w-full py-4 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
            <i className="fas fa-check"></i> {t("saveChanges") || "Save Changes"}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="w-full py-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-center cursor-pointer">
            Discard Changes
          </button>
        </div>
      </form>
    </div>
  )
}
export default AddClassPage;

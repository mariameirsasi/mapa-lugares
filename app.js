const { useState, useEffect, useRef, useMemo } = React;

const STORE = 'seatmap_v1';
const SECTOR_KEYS = ['comercial', 'marketing', 'juridico', 'tecnico'];
const TOTAL_SEATS = window.DESKS.length * 6;

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function load() {
  try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch { return {}; }
}

let _uid = Date.now();
const uid = () => 'p' + (_uid++).toString(36);

/* ---- Seat ---- */
function Seat({ seat, person, deskId, sm, onDropPerson, onDragStartSeat, onClickEmpty, onRemove, onPointerDragStart }) {
  const [over, setOver] = useState(false);
  const sector = person ? window.SECTORS[person.sector] : null;
  const seatId = deskId + '-' + seat.n;

  return (
    <div className="seat-wrap" style={{ left: seat.cx, top: seat.cy }} data-seat-id={seatId}>
      <div
        className={'seat' + (sm ? ' sm' : '') + (person ? ' filled' : ' empty') + (over ? ' over' : '')}
        draggable={!!person}
        onPointerDown={(e) => {
          if (person && e.pointerType !== 'mouse') onPointerDragStart(e, person.id, seatId);
        }}
        onDragStart={(e) => { if (person) onDragStartSeat(e, seatId, person.id); }}
        onDragOver={(e) => { e.preventDefault(); if (!over) setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); onDropPerson(e, seatId); }}
        onClick={(e) => { if (!person && e.pointerType !== 'touch') onClickEmpty(seatId, seat); }}
        onPointerUp={(e) => { if (!person && e.pointerType === 'touch') onClickEmpty(seatId, seat); }}
        style={person ? {
          background: sector.color,
          boxShadow: over ? `0 0 0 3px #fff, 0 0 0 6px ${sector.color}` : 'none'
        } : {}}
        title={person ? person.name + ' · ' + sector.label : 'Cadeira ' + seat.n}>
        {person ? initials(person.name) : over ? '↓' : '+'}
        {person && (
          <button className="seat-remove"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onRemove(seatId); }}
            title="Remover">×</button>
        )}
      </div>
      {person && !sm && <div className="seat-name">{person.name.split(/\s+/)[0]}</div>}
    </div>
  );
}

/* ---- Desk ---- */
function Desk({ desk, assignments, peopleById, handlers }) {
  const L = window.seatLayout(desk);
  return (
    <div className="island" style={{ left: desk.x, top: desk.y, width: L.W, height: L.H }}>
      <div className="desk-surface"
        style={{ left: L.surf.left, top: L.surf.top, width: L.surf.width, height: L.surf.height }}>
        <div className="desk-spine" />
      </div>
      <div className={'desk-flag' + (L.small ? ' sm' : '')}>{desk.label}</div>
      {L.seats.map((seat) => {
        const seatId = desk.id + '-' + seat.n;
        const pid = assignments[seatId];
        const person = pid ? peopleById[pid] : null;
        return (
          <Seat
            key={seat.n}
            seat={{ ...seat, cx: seat.cx - desk.x, cy: seat.cy - desk.y }}
            person={person}
            deskId={desk.id}
            sm={L.small}
            {...handlers}
          />
        );
      })}
    </div>
  );
}

/* ---- ZoneEl ---- */
function ZoneEl({ z }) {
  return (
    <div className={'zone zone-' + z.kind} style={{ left: z.x, top: z.y, width: z.w, height: z.h }}>
      <span className="zone-label">{z.label}</span>
    </div>
  );
}

/* ---- PersonCard ---- */
function PersonCard({ person, onDragStart, onDelete, seated, onPointerDragStart }) {
  const s = window.SECTORS[person.sector];
  return (
    <div
      className={'pcard' + (seated ? ' seated' : '')}
      draggable={!seated}
      onPointerDown={(e) => { if (!seated && e.pointerType !== 'mouse') onPointerDragStart(e, person.id, null); }}
      onDragStart={(e) => !seated && onDragStart(e, person.id)}
      title={seated ? person.name + ' (já alocado)' : 'Arraste para uma cadeira'}>
      <div className="pcard-av" style={{ background: s.color }}>{initials(person.name)}</div>
      <div className="pcard-name">{person.name}</div>
      {seated
        ? <span className="pcard-seat">●</span>
        : <button className="pcard-del"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(person.id); }}
            title="Excluir">×</button>
      }
    </div>
  );
}

/* ---- Picker (bottom sheet) ---- */
function Picker({ picker, people, seatedIds, onClose, onPick }) {
  const [q, setQ] = useState('');
  const avail = people.filter(p =>
    !seatedIds.has(p.id) && p.name.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-head">
          <div>
            <h3>Alocar lugar</h3>
            <p>{picker.deskLabel} · Cadeira {picker.seatN}</p>
          </div>
          <button className="x" onClick={onClose}>×</button>
        </div>
        <input autoFocus className="input" placeholder="Buscar pessoa…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="picker-list">
          {avail.length === 0 && (
            <p className="empty-note">Nenhuma pessoa disponível. Cadastre alguém primeiro.</p>
          )}
          {SECTOR_KEYS.map((k) => {
            const grp = avail.filter(p => p.sector === k);
            if (!grp.length) return null;
            return (
              <div key={k} className="pick-group">
                <div className="pick-group-h" style={{ color: window.SECTORS[k].color }}>
                  <i style={{ background: window.SECTORS[k].color }} />
                  {window.SECTORS[k].label}
                </div>
                {grp.map(p => (
                  <button key={p.id} className="pick-row" onClick={() => onPick(p.id)}>
                    <span className="pick-av" style={{ background: window.SECTORS[k].color }}>
                      {initials(p.name)}
                    </span>
                    {p.name}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- App ---- */
function App() {
  const saved = load();
  const [people, setPeople] = useState(saved.people || []);
  const [assignments, setAssignments] = useState(saved.assignments || {});
  const [name, setName] = useState('');
  const [sector, setSector] = useState('comercial');
  const [filter, setFilter] = useState('todos');
  const [picker, setPicker] = useState(null);
  const [scale, setScale] = useState(1);
  const [poolOver, setPoolOver] = useState(false);
  const stageRef = useRef(null);
  const dragRef = useRef({ active: false, ghost: null, personId: null, fromSeatId: null });
  const fnRef = useRef({});

  useEffect(() => {
    localStorage.setItem(STORE, JSON.stringify({ people, assignments }));
  }, [people, assignments]);

  useEffect(() => {
    function fit() {
      const el = stageRef.current;
      if (!el) return;
      const pad = 24;
      const s = Math.min(
        (el.clientWidth - pad) / window.FLOOR.w,
        (el.clientHeight - pad) / window.FLOOR.h
      );
      setScale(Math.max(0.15, Math.min(s, 1.1)));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const peopleById = useMemo(() => Object.fromEntries(people.map(p => [p.id, p])), [people]);
  const seatedIds = useMemo(() => new Set(Object.values(assignments)), [assignments]);

  function addPerson(e) {
    e && e.preventDefault();
    const nm = name.trim();
    if (!nm) return;
    setPeople(ps => [...ps, { id: uid(), name: nm, sector }]);
    setName('');
  }

  function deletePerson(pid) {
    setPeople(ps => ps.filter(p => p.id !== pid));
    setAssignments(a => {
      const n = { ...a };
      for (const k of Object.keys(n)) if (n[k] === pid) delete n[k];
      return n;
    });
  }

  function seatOf(pid) {
    return Object.keys(assignments).find(k => assignments[k] === pid);
  }

  function assign(personId, seatId, fromSeatId) {
    setAssignments(a => {
      const n = { ...a };
      const prev = fromSeatId !== undefined ? fromSeatId : seatOf(personId);
      const occupant = n[seatId];
      if (prev) delete n[prev];
      n[seatId] = personId;
      if (prev && occupant && occupant !== personId) n[prev] = occupant;
      return n;
    });
  }

  function unassign(seatId) {
    setAssignments(a => { const n = { ...a }; delete n[seatId]; return n; });
  }

  fnRef.current.assign = assign;
  fnRef.current.unassign = unassign;
  fnRef.current.setPicker = setPicker;

  function startPointerDrag(e, personId, fromSeatId) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const g = el.cloneNode(true);
    const isCircle = el.classList.contains('seat');
    Object.assign(g.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '9999', opacity: '0.85',
      width: rect.width + 'px', height: rect.height + 'px', margin: '0', transition: 'none',
      left: (e.clientX - rect.width / 2) + 'px', top: (e.clientY - rect.height / 2) + 'px',
      borderRadius: isCircle ? '50%' : '10px', transform: 'scale(1.08)',
      boxShadow: '0 8px 24px rgba(0,0,0,.3)',
    });
    document.body.appendChild(g);
    dragRef.current = { active: true, personId, fromSeatId: fromSeatId || null, ghost: g };
  }

  useEffect(() => {
    function onMove(e) {
      const d = dragRef.current;
      if (!d.active || !d.ghost) return;
      d.ghost.style.left = (e.clientX - d.ghost.offsetWidth / 2) + 'px';
      d.ghost.style.top = (e.clientY - d.ghost.offsetHeight / 2) + 'px';
    }
    function onUp(e) {
      const d = dragRef.current;
      if (!d.active) return;
      if (d.ghost) { d.ghost.remove(); d.ghost = null; }
      dragRef.current = { active: false };
      const els = document.elementsFromPoint(e.clientX, e.clientY);
      for (const el of els) {
        const sw = el.closest('[data-seat-id]');
        if (sw) { fnRef.current.assign(d.personId, sw.dataset.seatId, d.fromSeatId); return; }
        if (el.closest('[data-pool]')) { if (d.fromSeatId) fnRef.current.unassign(d.fromSeatId); return; }
      }
    }
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, []);

  const handlers = {
    onDragStartSeat: (e, seatId, personId) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ t: 'seat', seatId, personId }));
      e.dataTransfer.effectAllowed = 'move';
    },
    onDropPerson: (e, seatId) => {
      let d; try { d = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
      if (!d) return;
      assign(d.personId, seatId, d.t === 'seat' ? d.seatId : null);
    },
    onClickEmpty: (seatId, seat) => {
      const desk = window.DESKS.find(dk => seatId.startsWith(dk.id + '-'));
      setPicker({ seatId, deskLabel: desk ? desk.label : '', seatN: seat.n });
    },
    onRemove: (seatId) => unassign(seatId),
    onPointerDragStart: startPointerDrag,
  };

  function poolDragStart(e, personId) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ t: 'pool', personId }));
    e.dataTransfer.effectAllowed = 'move';
  }
  function poolDrop(e) {
    e.preventDefault(); setPoolOver(false);
    let d; try { d = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { return; }
    if (d && d.t === 'seat') unassign(d.seatId);
  }

  const allocated = seatedIds.size;
  const visiblePool = people.filter(p => filter === 'todos' || p.sector === filter);
  const available = visiblePool.filter(p => !seatedIds.has(p.id));
  const seatedList = visiblePool.filter(p => seatedIds.has(p.id));

  function loadSample() {
    const names = {
      comercial: ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Reis'],
      marketing: ['Elisa Maia', 'Felipe Antunes', 'Gabi Rocha'],
      juridico: ['Helena Castro', 'Igor Nunes'],
      tecnico: ['Júlia Pires', 'Kaique Melo', 'Lucas Faria', 'Marina Alves', 'Nina Costa'],
    };
    const ps = [];
    Object.entries(names).forEach(([sec, list]) =>
      list.forEach(nm => ps.push({ id: uid(), name: nm, sector: sec }))
    );
    setPeople(ps); setAssignments({});
  }

  function clearAll() {
    if (!confirm('Limpar todos os cadastros e alocações?')) return;
    setPeople([]); setAssignments({});
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <h1>Mapa de Lugares</h1>
            <p>Andar Operacional · alocação por setor</p>
          </div>
        </div>
        <div className="top-actions">
          <button className="btn ghost" onClick={loadSample}>Exemplo</button>
          <button className="btn ghost" onClick={clearAll}>Limpar</button>
        </div>
        <div className="stats">
          <div className="stat"><b>{window.DESKS.length}</b><span>mesas</span></div>
          <div className="stat"><b>{allocated}</b><span>alocados</span></div>
          <div className="stat"><b>{TOTAL_SEATS - allocated}</b><span>livres</span></div>
          <div className="stat"><b>{people.length}</b><span>cadastrados</span></div>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <section className="card">
            <h2>Cadastrar pessoa</h2>
            <form onSubmit={addPerson} className="reg-form">
              <input className="input" placeholder="Nome da pessoa"
                value={name} onChange={(e) => setName(e.target.value)} />
              <div className="sector-pick">
                {SECTOR_KEYS.map(k => (
                  <button type="button" key={k}
                    className={'sector-chip' + (sector === k ? ' on' : '')}
                    style={sector === k
                      ? { background: window.SECTORS[k].color, borderColor: window.SECTORS[k].color, color: '#fff' }
                      : { color: window.SECTORS[k].color, borderColor: window.SECTORS[k].color }}
                    onClick={() => setSector(k)}>
                    {window.SECTORS[k].label}
                  </button>
                ))}
              </div>
              <button className="btn primary" type="submit">
                + Adicionar ao {window.SECTORS[sector].label}
              </button>
            </form>
          </section>

          <section className="card pool-card">
            <div className="pool-head">
              <h2>Pessoas</h2>
              <span className="hint">toque + para alocar</span>
            </div>
            <div className="filter-tabs">
              <button className={'ftab' + (filter === 'todos' ? ' on' : '')}
                onClick={() => setFilter('todos')}>Todos</button>
              {SECTOR_KEYS.map(k => (
                <button key={k} className={'ftab' + (filter === k ? ' on' : '')}
                  onClick={() => setFilter(k)}>
                  <i style={{ background: window.SECTORS[k].color }} />
                  {window.SECTORS[k].label}
                </button>
              ))}
            </div>
            <div
              className={'pool' + (poolOver ? ' dragover' : '')}
              data-pool="true"
              onDragOver={(e) => { e.preventDefault(); setPoolOver(true); }}
              onDragLeave={() => setPoolOver(false)}
              onDrop={poolDrop}>
              <div className="pool-sub">Disponíveis ({available.length})</div>
              {available.length === 0 && <p className="empty-note">Ninguém disponível neste filtro.</p>}
              <div className="pool-grid">
                {available.map(p => (
                  <PersonCard key={p.id} person={p}
                    onDragStart={poolDragStart} onDelete={deletePerson}
                    onPointerDragStart={startPointerDrag} />
                ))}
              </div>
              {seatedList.length > 0 && <div className="pool-sub muted">Já alocados ({seatedList.length})</div>}
              <div className="pool-grid">
                {seatedList.map(p => (
                  <PersonCard key={p.id} person={p} seated onDelete={deletePerson}
                    onPointerDragStart={startPointerDrag} />
                ))}
              </div>
            </div>
          </section>
        </aside>

        <main className="stage" ref={stageRef}>
          <div className="floor-scaler"
            style={{ transform: `scale(${scale})`, width: window.FLOOR.w, height: window.FLOOR.h }}>
            <div className="floor" style={{ width: window.FLOOR.w, height: window.FLOOR.h }}>
              <div className="tiles" />
              {window.WINDOWS.map((w, i) => (
                <div key={i} className={'window window-' + w.side}
                  style={{ left: w.x, top: w.y, width: w.w, height: w.h }} />
              ))}
              {window.ZONES.map(z => <ZoneEl key={z.id} z={z} />)}
              {window.COLUMNS.map((c, i) => (
                <div key={i} className="pillar" style={{ left: c.x - 22, top: c.y - 22 }} />
              ))}
              {window.DESKS.map(d => (
                <Desk key={d.id} desk={d} assignments={assignments}
                  peopleById={peopleById} handlers={handlers} />
              ))}
              <div className="floor-legend">
                {SECTOR_KEYS.map(k => (
                  <div key={k} className="lg">
                    <i style={{ background: window.SECTORS[k].color }} />
                    {window.SECTORS[k].label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {picker && (
        <Picker
          picker={picker} people={people} seatedIds={seatedIds}
          onClose={() => setPicker(null)}
          onPick={(pid) => { assign(pid, picker.seatId); setPicker(null); }}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

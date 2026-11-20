"use client";

import { useState } from "react";
import { GlobeScene } from "./deferred-scenes";
import { OFFICES } from "./data";

export default function GlobalPresence() {
  const [active, setActive] = useState(0);
  return <section className="wrap sec where presence" id="global-presence" aria-labelledby="presence-title">
    <div className="where-text">
      <p className="eyebrow"><span aria-hidden="true">//:</span>Our Global Presence</p>
      <h2 id="presence-title">Rooted in Abu Dhabi.<br /><span>Connected globally.</span></h2>
      <p className="presence-intro">Three hubs supporting your next technology project.</p>
      <ul className="presence-offices" aria-label="Select a hub to locate it on the globe">
        {OFFICES.map((office, i) => <li key={office.city}>
          <button type="button" className={active === i ? "is-active" : ""} aria-pressed={active === i}
            onPointerEnter={e => { if (e.pointerType === "mouse") setActive(i); }} onFocus={() => setActive(i)} onClick={() => setActive(i)}>
            <span className="presence-city">{office.city}{i === 0 && <span className="presence-hq">HQ</span>}</span>
            <span className="presence-detail">{office.name} · {office.country}</span>
            <span className="presence-locate" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></svg></span>
          </button>
        </li>)}
      </ul>
    </div>
    <div className="presence-visual">
      <div className="where-globe"><GlobeScene active={active} onSelect={setActive} /></div>
      <p className="presence-caption" aria-live="polite"><span />{OFFICES[active].city} / {OFFICES[active].name}</p>
    </div>
  </section>;
}

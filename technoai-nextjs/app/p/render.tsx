// Renders a page model (content/models/*.json) with the home page's design language:
// cinematic hero, section heads with rising words, photo cards, numbered rows, split text + picture,
// statements that light up word by word, call-to-action bands, articles. All content comes from the
// original WordPress page; only the layout is new. Motion hooks are the home page's (motion.tsx).

import { SiteImage } from "../image";
import { Arrow, Eyebrow, Words } from "../interior-kit/ui";
import { SiteForm } from "./form";
import { GLScene } from "../interior-kit/gl/host";
import type { Block, Card, PageModel } from "./model";
import dimensions from "../../content/image-dimensions.json";

const imageSizes: Record<string, { width: number; height: number }> = dimensions;
const splitSizes = "(max-width: 1020px) 100vw, 50vw";
const twoColumnSizes = "(max-width: 640px) 100vw, 50vw";
const cardSizes = "(max-width: 640px) 100vw, (max-width: 1020px) 50vw, 33vw";
// Wide announcement artwork and portrait covers must remain readable in card previews.
const containPreview = (src: string) => {
  const size = imageSizes[src];
  return !!size && (size.width / size.height > 2.2 || size.width / size.height < .8);
};

// ---------------------------------------------------------------- helpers
const num = (i: number) => String(i + 1).padStart(2, "0");
const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
/** inline html -> plain text; <br> becomes a line break for <Words>. */
const plain = (html: string) => decode(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").trim();
const Html = ({ html, as: Tag = "p", className }: { html: string; as?: "p" | "span" | "li" | "h3" | "h4" | "div"; className?: string }) => (
  <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
);
/** Inside a card that is itself a link, inner links must go (an <a> may not contain another <a>). */
const unlink = (html: string) => html.replace(/<a\s[^>]*>|<a>|<\/a>/gi, "");
const isExternal = (href?: string) => !!href && /^https?:/.test(href);
const linkProps = (href?: string) => (isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {});
const usable = (href?: string) => !!href && href !== "#" && !/^javascript:/i.test(href);

function Buttons({ items, tags }: { items: { text: string; href: string }[]; tags?: boolean }) {
  if (!items.length) return null;
  // buttons without a real link are labels (e.g. partner capability tags)
  const links = items.filter((b) => usable(b.href));
  const labels = items.filter((b) => !usable(b.href));
  return (
    <>
      {labels.length > 0 && (
        <ul className="pg-tags" data-reveal>
          {labels.map((b, i) => <li key={i}>{b.text}</li>)}
        </ul>
      )}
      {links.length > 0 && (
        <div className="actions pg-actions" data-reveal>
          {links.map((b, i) => (
            <a key={i} className={`btn ${i === 0 && !tags ? "btn-fill" : "btn-line"}`} href={b.href} {...linkProps(b.href)} data-magnetic={i === 0 ? true : undefined}>
              {b.text} {i === 0 && <Arrow />}
            </a>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- hero
// Breadcrumb parent for each page group (label shown above the title, see [...slug]/page.tsx).
const PARENTS: Record<string, [string, string]> = {
  "TechnoAi Solutions": ["Solutions", "/solutions/"],
  "Industries We Serve": ["Industries", "/industries/"],
  "TechnoAi Services": ["Services", "/services/"],
  "Insights": ["Insights", "/insights/"],
  "Case Study": ["Case Studies", "/case-study/"],
  "Trusted by Organizations": ["Partners", "/partners/"],
};

function Crumbs({ route, group, title }: { route: string; group: string; title: string }) {
  const parent = PARENTS[group];
  const short = title.length > 48 ? title.slice(0, 46).trimEnd() + "…" : title;
  return (
    <nav className="crumbs fade" data-reveal aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        {parent && parent[1] !== route && <li><a href={parent[1]}>{parent[0]}</a></li>}
        <li aria-current="page">{short}</li>
      </ol>
    </nav>
  );
}

export function PageHero({ model, group }: { model: PageModel; group: string }) {
  const { hero } = model;
  const image = hero.image || (model.kind === "post" ? model.ogImage : undefined);
  const date = model.kind === "post" && model.date ? new Date(model.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <section className={`pg-hero${image ? " has-img" : ""}`} data-progress>
      <div className="pg-hero-pin">
        {image && (
          <div className="pg-hero-media" aria-hidden="true">
            <SiteImage src={image} alt="" sizes="100vw" fetchPriority="high" />
          </div>
        )}
        {!image && <GLScene kind="field" className="pg-hero-gl" rootSelector=".pg-hero" />}
        <div className="pg-hero-glow" aria-hidden="true" />
        <div className="pg-hero-shade" aria-hidden="true" />
        <div className="wrap pg-hero-crumbs">
          <Crumbs route={model.route} group={group} title={plain(hero.title).replace(/\n/g, " ")} />
        </div>
        <div className="wrap pg-hero-body">
          <Eyebrow>{hero.eyebrow || group}</Eyebrow>
          <Words as="h1" className={`pg-title${plain(hero.title).length > 64 ? " is-long" : ""}`} text={plain(hero.title)} />
          {date && <p className="pg-date fade" data-reveal>{date}</p>}
          {hero.lead.length > 0 && (
            <div className="pg-lead fade" data-reveal>
              {hero.lead.map((p, i) => <Html key={i} html={p} />)}
            </div>
          )}
          <Buttons items={hero.buttons} />
        </div>
        <div className="pg-hero-hint" aria-hidden="true"><span>Scroll</span><i /></div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- chunking
type Chunk = Block[];

/** A WordPress section can hold several topics (all-products); split it at each new heading. */
function chunksOf(blocks: Block[]): Chunk[] {
  const out: Chunk[] = [];
  let cur: Chunk = [];
  let seenHead = false;
  let seenBody = false;
  for (const b of blocks) {
    const startsTopic = b.t === "eyebrow" || (b.t === "h" && b.level <= 3);
    if (startsTopic && seenHead && seenBody) {
      out.push(cur);
      cur = [];
      seenHead = seenBody = false;
    }
    if (b.t === "h") seenHead = true;
    else if (b.t !== "eyebrow" && b.t !== "icon") seenBody = seenBody || seenHead;
    cur.push(b);
  }
  if (cur.length) out.push(cur);
  return out;
}

type Head = { eyebrow?: string; title?: string; intro: string[]; buttons: { text: string; href: string }[]; icon?: string };
/** Leading eyebrow / heading / intro paragraphs / buttons of a chunk; returns the rest as body. */
function splitHead(chunk: Chunk): { head: Head; body: Block[] } {
  const head: Head = { intro: [], buttons: [] };
  const lead: Block[] = []; // pictures placed before the heading stay with the section body
  let i = 0;
  for (; i < chunk.length; i++) {
    const b = chunk[i];
    if (b.t === "img" && !head.title) lead.push(b);
    else if (b.t === "icon" && !head.title) head.icon = b.svg;
    else if (b.t === "eyebrow" && !head.title) head.eyebrow = b.text;
    else if (b.t === "h" && !head.title) {
      // two headings in a row: the first, if short, works as the eyebrow
      const next = chunk[i + 1];
      if (next?.t === "h" && plain(b.html).length <= 48 && !head.eyebrow) head.eyebrow = plain(b.html);
      else head.title = b.html;
    } else if (b.t === "p" && head.title && head.intro.length < 3) head.intro.push(b.html);
    else if (b.t === "btn" && head.title) head.buttons.push({ text: b.text, href: b.href });
    else break;
  }
  return { head, body: [...lead, ...chunk.slice(i)] };
}

// ---------------------------------------------------------------- body blocks (prose)
function Body({ blocks }: { blocks: Block[] }) {
  const out: React.ReactNode[] = [];
  let buttons: { text: string; href: string }[] = [];
  const flush = (k: number) => {
    if (buttons.length) out.push(<Buttons key={`b${k}`} items={buttons} />);
    buttons = [];
  };
  blocks.forEach((b, k) => {
    if (b.t !== "btn") flush(k);
    switch (b.t) {
      case "eyebrow": out.push(<Eyebrow key={k}>{b.text}</Eyebrow>); break;
      case "h": out.push(<Html key={k} as={b.level <= 3 ? "h3" : "h4"} className="pg-h fade" html={b.html} />); break;
      case "p": out.push(<p key={k} className="fade" data-reveal dangerouslySetInnerHTML={{ __html: b.html }} />); break;
      case "ul": {
        const L = b.ordered ? "ol" : "ul";
        out.push(<L key={k} className="pg-list fade" data-reveal>{b.items.map((li, j) => <li key={j} dangerouslySetInnerHTML={{ __html: li }} />)}</L>);
        break;
      }
      case "img": if (!b.small) out.push(<figure key={k} className="pg-fig"><SiteImage className="rv-img" data-reveal src={b.src} alt={b.alt} sizes="(max-width: 900px) 100vw, 880px" loading="lazy" /></figure>); break;
      case "btn": buttons.push({ text: b.text, href: b.href }); break;
      case "video": out.push(<Video key={k} src={b.src} iframe={b.iframe} />); break;
      case "grid": out.push(<Grid key={k} items={b.items} />); break;
      case "form": out.push(<SiteForm key={k} form={b} />); break;
    }
  });
  flush(blocks.length);
  return <>{out}</>;
}

function Video({ src, iframe }: { src: string; iframe?: boolean }) {
  return (
    <div className={`pg-video${iframe ? " is-embed" : ""}`} data-reveal>
      {iframe ? <iframe src={src} title="Video" loading="lazy" allow="fullscreen; picture-in-picture" allowFullScreen /> : <video src={src} controls playsInline preload="metadata" />}
    </div>
  );
}

// ---------------------------------------------------------------- grids
function Grid({ items }: { items: Card[] }) {
  const withImages = items.filter((c) => c.image).length >= Math.ceil(items.length / 2);
  const bannerGrid = items.every((c) => c.image && imageSizes[c.image] && imageSizes[c.image].width / imageSizes[c.image].height > 2.2);
  if (withImages) {
    return (
      <div className={`pg-cards n${Math.min(items.length, 4)}${bannerGrid ? " is-banner-grid" : ""}`}>
        {items.map((c0, i) => {
          const Tag = usable(c0.href) ? "a" : "div";
          const c = Tag === "a" ? { ...c0, title: c0.title && unlink(c0.title), text: c0.text.map(unlink), list: c0.list?.map(unlink) } : c0;
          return (
            <Tag key={i} className="pg-card fade" data-reveal data-tilt style={{ "--rd": `${(i % 4) * 0.08}s` } as React.CSSProperties}
              {...(Tag === "a" ? { href: c.href, "data-cursor": "View", ...linkProps(c.href) } : {})}>
              {c.image && (
                <div className={`pg-card-media${containPreview(c.image) ? " is-artwork" : ""}`}>
                  <SiteImage className="pg-card-img" src={c.image} alt="" sizes={items.length === 3 ? cardSizes : twoColumnSizes} loading="lazy" />
                </div>
              )}
              <div className="pg-card-body">
                {c.eyebrow && <span className="n">{c.eyebrow}</span>}
                {c.title && <Html as="h3" html={c.title} />}
                {c.text.map((t, j) => <Html key={j} html={t} />)}
                {c.list && c.list.length > 0 && <ul className="pg-list">{c.list.map((li, j) => <li key={j} dangerouslySetInnerHTML={{ __html: li }} />)}</ul>}
                {usable(c.href) && <span className="link">{c.cta || "Learn More"} <Arrow /></span>}
              </div>
            </Tag>
          );
        })}
      </div>
    );
  }
  // no pictures: numbered rows, like "Industries We Serve" on the home page
  return (
    <div className="ind-list pg-rows">
      {items.map((c0, i) => {
        const Tag = usable(c0.href) ? "a" : "div";
        const c = Tag === "a" ? { ...c0, title: c0.title && unlink(c0.title), text: c0.text.map(unlink), list: c0.list?.map(unlink) } : c0;
        return (
          <Tag key={i} className={`ind${c.text.length || c.list?.length ? "" : " short"}`} data-reveal
            {...(Tag === "a" ? { href: c.href, "data-cursor": "Open", ...linkProps(c.href) } : {})}>
            {c.icon ? <span className="pg-ico" aria-hidden="true" dangerouslySetInnerHTML={{ __html: c.icon }} /> : <span className="n">{num(i)}</span>}
            {c.title ? <Html as="h3" html={c.title} /> : <span />}
            <div className="pg-row-text">
              {c.text.map((t, j) => <Html key={j} html={t} />)}
              {c.list && c.list.length > 0 && <ul className="pg-list">{c.list.map((li, j) => <li key={j} dangerouslySetInnerHTML={{ __html: li }} />)}</ul>}
            </div>
            {Tag === "a" ? <span className="ind-go" aria-hidden="true"><Arrow /></span> : <span />}
          </Tag>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- sections
function SecHead({ head, center }: { head: Head; center?: boolean }) {
  if (!head.title && !head.eyebrow && !head.intro.length) return null;
  return (
    <div className={`sec-head${center ? " center" : ""}`}>
      <div>
        {head.icon && <span className="pg-ico big" aria-hidden="true" dangerouslySetInnerHTML={{ __html: head.icon }} />}
        {head.eyebrow && <Eyebrow>{head.eyebrow}</Eyebrow>}
        {head.title && <Words text={plain(head.title)} />}
      </div>
      {head.intro.length > 0 && (
        <div className="pg-intro fade" data-reveal>
          {head.intro.map((p, i) => <Html key={i} html={p} />)}
        </div>
      )}
    </div>
  );
}

const textLength = (blocks: Block[]) => blocks.reduce((n, b) => n + (b.t === "p" ? plain(b.html).length : b.t === "ul" ? b.items.join(" ").length : 0), 0);

function ChunkView({ chunk, index }: { chunk: Chunk; index: number }) {
  const { head, body } = splitHead(chunk);
  const grids = body.filter((b) => b.t === "grid");
  const forms = body.filter((b) => b.t === "form");
  const images = chunk.filter((b): b is Extract<Block, { t: "img" }> => b.t === "img" && !b.small);
  const smallImgs = chunk.filter((b): b is Extract<Block, { t: "img" }> => b.t === "img" && !!b.small);
  const words = textLength(chunk) + head.intro.join(" ").length;

  // 1. grids (cards / rows) under a section head
  if (grids.length) {
    return (
      <section className="wrap sec pg-sec">
        <SecHead head={head} />
        <Body blocks={body} />
        <Buttons items={head.buttons} />
      </section>
    );
  }

  // 2. a form (newsletter)
  if (forms.length) {
    return (
      <section className="wrap sec pg-sec pg-form-sec" data-glow>
        <SecHead head={head} />
        <Body blocks={body} />
      </section>
    );
  }

  // 3. several pictures between paragraphs: alternating picture / text rows
  if (images.length >= 3) {
    const rows: { img?: Extract<Block, { t: "img" }>; blocks: Block[] }[] = [];
    let row: { img?: Extract<Block, { t: "img" }>; blocks: Block[] } = { blocks: [] };
    for (const b of body) {
      if (b.t === "img" && !b.small) {
        if (row.img || row.blocks.length) rows.push(row);
        row = { img: b, blocks: [] };
      } else row.blocks.push(b);
    }
    rows.push(row);
    return (
      <section className="wrap sec pg-sec">
        <SecHead head={head} />
        <div className="pg-story">
          {rows.map((r, i) => (
            <div className={`pg-story-row${r.img ? "" : " text-only"}`} key={i}>
              {r.img && <figure className={`pg-fig${r.img.bg ? "" : " is-artwork"}`}><SiteImage className="rv-img" data-reveal src={r.img.src} alt={r.img.alt} sizes={splitSizes} loading="lazy" /></figure>}
              <div className="pg-prose-body"><Body blocks={r.blocks} /></div>
            </div>
          ))}
        </div>
        <Buttons items={head.buttons} />
      </section>
    );
  }

  // 4. text + one or two pictures: split layout (logo first when there is a separate photo)
  if (images.length) {
    const photo = images.find((b) => b.bg) || images[images.length - 1];
    const logo = images.length > 1 && images[0] !== photo ? images[0] : smallImgs[0];
    const rest = body.filter((b) => b !== photo && b !== logo);
    return (
      <section className={`wrap sec pg-sec pg-split${index % 2 ? " flip" : ""}`}>
        <div className="pg-split-text">
          {logo && <SiteImage className="pg-logo fade" data-reveal src={logo.src} alt={logo.alt} sizes="240px" loading="lazy" />}
          {head.eyebrow && <Eyebrow>{head.eyebrow}</Eyebrow>}
          {head.title && <Words text={plain(head.title)} />}
          <div className="pg-prose-body">
            {head.intro.map((p, i) => <p key={i} className="fade" data-reveal dangerouslySetInnerHTML={{ __html: p }} />)}
            <Body blocks={rest} />
          </div>
          <Buttons items={head.buttons} />
        </div>
        <figure className={`pg-split-media${photo.bg ? "" : " is-artwork"}`}>
          <div className="pg-split-frame">
            <SiteImage className="rv-img" data-reveal src={photo.src} alt={photo.alt} sizes={splitSizes} loading="lazy" />
          </div>
        </figure>
      </section>
    );
  }

  // 5. a single short line without a heading: a statement that lights up word by word
  if (!head.title && words <= 360 && body.every((b) => b.t === "p" || b.t === "btn")) {
    const text = plain(body.filter((b) => b.t === "p").map((b) => (b as { html: string }).html).join(" "));
    const btns = body.filter((b): b is Extract<Block, { t: "btn" }> => b.t === "btn");
    if (!text) return btns.length ? <section className="wrap pg-sec pg-btns"><Buttons items={btns} /></section> : null;
    const ws = text.split(/\s+/);
    return (
      <section className="manifesto pg-statement" data-progress="view">
        <div className="wrap">
          {head.eyebrow && <Eyebrow>{head.eyebrow}</Eyebrow>}
          <p className="manifesto-t" style={{ "--n": ws.length } as React.CSSProperties}>
            {ws.map((w, i) => <span key={i} style={{ "--i": i } as React.CSSProperties}>{w} </span>)}
          </p>
          <Buttons items={btns} />
        </div>
      </section>
    );
  }

  // 6. heading + a little text + button(s): a call-to-action band
  const bodyBtns = body.filter((b): b is Extract<Block, { t: "btn" }> => b.t === "btn");
  if (head.title && (head.buttons.length || bodyBtns.length) && words <= 420) {
    return (
      <section className="pg-band" data-glow>
        <div className="pg-band-glow" aria-hidden="true" />
        <div className="wrap pg-band-in">
          {head.eyebrow && <Eyebrow>{head.eyebrow}</Eyebrow>}
          <Words text={plain(head.title)} className="pg-band-t" />
          <div className="pg-band-row">
            <div className="pg-intro fade" data-reveal>
              {head.intro.map((p, i) => <Html key={i} html={p} />)}
              <Body blocks={body.filter((b) => b.t !== "btn")} />
            </div>
            <Buttons items={[...head.buttons, ...bodyBtns.map((b) => ({ text: b.text, href: b.href }))]} />
          </div>
        </div>
      </section>
    );
  }

  // 7. text: heading on the left (sticky), text on the right
  return (
    <section className="wrap sec pg-sec pg-prose">
      <div className="pg-prose-head">
        {head.icon && <span className="pg-ico big" aria-hidden="true" dangerouslySetInnerHTML={{ __html: head.icon }} />}
        {head.eyebrow && <Eyebrow>{head.eyebrow}</Eyebrow>}
        {head.title && <Words text={plain(head.title)} />}
      </div>
      <div className="pg-prose-body">
        {head.intro.map((p, i) => <p key={i} className="fade" data-reveal dangerouslySetInnerHTML={{ __html: p }} />)}
        <Body blocks={body} />
        <Buttons items={head.buttons} />
      </div>
    </section>
  );
}

/** News posts: the story reads as one column; related posts / newsletter keep their own sections. */
function Article({ blocks }: { blocks: Block[] }) {
  // the first list in a post is its meta line (date, author, category)
  const first = blocks[0]?.t === "ul" ? blocks[0] : null;
  const rest = first ? blocks.slice(1) : blocks;
  return (
    <article className="wrap sec pg-article">
      {first && first.t === "ul" && (
        <ul className="pg-meta">{first.items.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: li }} />)}</ul>
      )}
      <div className="pg-article-body">
        <Body blocks={rest} />
      </div>
    </article>
  );
}

export function PageSections({ model }: { model: PageModel }) {
  let index = 0;
  return (
    <>
      {model.sections.map((s, si) => {
        const hasGridOrForm = s.blocks.some((b) => b.t === "grid" || b.t === "form");
        if (model.kind === "post" && !hasGridOrForm) return <Article key={si} blocks={s.blocks} />;
        return chunksOf(s.blocks).map((c, ci) => <ChunkView key={`${si}-${ci}`} chunk={c} index={index++} />);
      })}
    </>
  );
}
